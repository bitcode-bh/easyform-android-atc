
package com.sky.atc.easyformse;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Paint.Style;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.location.Location;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.DocumentsContract;
import android.provider.MediaStore;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.FileProvider;
import androidx.exifinterface.media.ExifInterface;

import android.provider.Settings;
import android.text.Html;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.method.LinkMovementMethod;
import android.text.style.ClickableSpan;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.View.OnTouchListener;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.Animation.AnimationListener;
import android.view.animation.AnimationUtils;
import android.webkit.URLUtil;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.SeekBar;
import android.widget.SeekBar.OnSeekBarChangeListener;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationListener;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.ColorPickerDialogs.OnColorChangedListener;
import com.sky.atc.easyformse.HSVColorPickerDialog.OnColorSelectedListener;
import com.sky.atc.easyformse.azurevision.AzureUtils;
import com.sky.atc.easyformse.azurevision.ComputerVisionDetection;
import com.sky.atc.easyformse.azurevision.TexRecognizationListener;
import com.sky.atc.easyformse.azurevision.TextRecognizationUtils;
import com.sky.atc.easyformse.azurevision.tflite.RectangleData;
import com.sky.atc.easyformse.azurevision.tflite.TFLiteObjectDetectionAPIModel;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.photo.PhotoConstants;
import com.sky.atc.easyformse.trip.TripMapUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


import static com.sky.atc.easyformse.DrawingView.originalBitmap;
import static com.sky.atc.easyformse.azurevision.ComputerVisionDetection.TF_OD_API_INPUT_SIZE;
import static com.sky.atc.easyformse.azurevision.ComputerVisionDetection.TF_OD_API_IS_QUANTIZED;
import static com.sky.atc.easyformse.azurevision.ComputerVisionDetection.TF_OD_API_LABELS_FILE;
import static com.sky.atc.easyformse.azurevision.ComputerVisionDetection.TF_OD_API_MODEL_FILE;
import static com.sky.atc.easyformse.azurevision.ComputerVisionDetection.resizeBitmapImageForFitSquare;
import static com.sky.atc.easyformse.cameraactivity.convertToMutable;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class easy_draw_new extends Activity implements OnClickListener,
        OnTouchListener, OnColorChangedListener, OnSeekBarChangeListener,
        AnimationListener, OnColorSelectedListener, LocationListener, TexRecognizationListener {
    public CallbackContext callbackContext;
    ImageView imageView;
    FrameLayout lan;
    ImageButton imagecolor, imgbrush, imaeraser;
    float downx = 0;
    float downy = 0;
    float upx = 0;
    float upy = 0;
    int count = 0;
    String path_mm;
    File imagesFolder;
    Bitmap bmp;
    Bitmap alteredBitmap;
    Canvas canvas;
    Paint paint;
    int rot = 0;
    File image;
    String phy_path;
    LinearLayout layout;
    OnColorChangedListener changedListener;
    Context context;
    int size = 1;
    B_new b;
    SeekBar seekBar;
    B_new b_count = new B_new();
    DrawingView mydrawingView;
    FrameLayout fbtn;
    LinearLayout layImg, layColor, layBrush, layErase;
    Runnable mRunnable;
    Handler mHandler = new Handler();
    Animation animFadein, animsave, animclear, animclear_new;
    int lanCamera_int = 0;
    int anim_count;
    MySharedPreferences pref;
    //    Editor editor;
    String picdevicelat, picdevicelng;
    int cameraviewid;
    String b_write;
    String mCurrentPhotoPath;
    String width, height, quality, flagdraw;
    static String drawflag;
    SQLiteDatabase database;
    File f_image;
    Uri outputFileUri;
    int ret;
    Button save, Retry;
    private int ColorAh = Color.WHITE;
    double deviceLat;
    double deviceLng;
    private GoogleApiClient googleApiClient;

    private int serverWidth;
    private int serverHeight;
    private ComputerVisionDetection computerVisionDetection;
    private TextView azureTextView, tvOldImage;
    private Button btnEnterManual, btnExit, btnRefresh;
    private TextView selectedReadingView;
    private ImageView imageTflite;
    private RadioGroup radioGroup;
    private RadioButton radioBtnAnalog;
    private RadioButton radioBtnSeven;
    private Bitmap lastBitmap;
    private String normalString = null;
    private String sevenString = null;
    private boolean isAPIcalled;
    String info;
    String max_file_size;
    String themecolor;
    public static Bitmap rotateImage(Bitmap source, float angle) {

        Bitmap retVal = source;
        if (!camera_new.isCropMode) {

            try {
                Matrix matrix = new Matrix();
                matrix.postRotate(angle);
                generateNoteOnSD("easydraw42.txt", "inside rotateImage");
                retVal = Bitmap.createBitmap(source, 0, 0, source.getWidth(),
                        source.getHeight(), matrix, true);
            } catch (Exception e) {


                final Writer result = new StringWriter();
                final PrintWriter printWriter = new PrintWriter(result);
                //////e.printStackTrac//////e.printWriter);
                String stacktrace = result.toString();
                printWriter.close();
                generateNoteOnSD("easydraw420.txt", stacktrace);
                retVal = source;

            }
        }
        return retVal;

    }

    private static int getRotation(Context context, Uri selectedImage) {
        int rotation = 0;
        ContentResolver content = context.getContentResolver();
        Cursor mediaCursor = content.query(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI, new String[]{
                        "orientation", "date_added"}, null, null,
                "date_added desc");

        if (mediaCursor != null && mediaCursor.getCount() != 0) {
            while (mediaCursor.moveToNext()) {
                rotation = mediaCursor.getInt(0);
                break;
            }
        }
        if (mediaCursor != null) {
            mediaCursor.close();
        }
        return rotation;
    }

    @RequiresApi(api = Build.VERSION_CODES.KITKAT)
    public static String getPath(final Context context, final Uri uri) {

        final boolean isKitKat = Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT;

        // DocumentProvider
        if (isKitKat && DocumentsContract.isDocumentUri(context, uri)) {
            // ExternalStorageProvider
            if (isExternalStorageDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                if ("primary".equalsIgnoreCase(type)) {
                    return Environment.getExternalStorageDirectory() + "/"
                            + split[1];
                }

                // TODO handle non-primary volumes
            }
            // DownloadsProvider
            else if (isDownloadsDocument(uri)) {

                final String id = DocumentsContract.getDocumentId(uri);
                final Uri contentUri = ContentUris.withAppendedId(
                        Uri.parse("content://downloads/public_downloads"),
                        Long.parseLong(id));

                return getDataColumn(context, contentUri, null, null);
            }
            // MediaProvider
            else if (isMediaDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                Uri contentUri = null;
                if ("image".equals(type)) {
                    contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video".equals(type)) {
                    contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio".equals(type)) {
                    contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }

                final String selection = "_id=?";
                final String[] selectionArgs = new String[]{split[1]};

                return getDataColumn(context, contentUri, selection,
                        selectionArgs);
            }
        }
        // MediaStore (and general)
        else if ("content".equalsIgnoreCase(uri.getScheme())) {

            // Return the remote address
            if (isGooglePhotosUri(uri))
                return uri.getLastPathSegment();

            return getDataColumn(context, uri, null, null);
        }
        // File
        else if ("file".equalsIgnoreCase(uri.getScheme())) {
            return uri.getPath();
        }

        return null;
    }


    public static String getDataColumn(Context context, Uri uri,
                                       String selection, String[] selectionArgs) {

        Cursor cursor = null;
        final String column = "_data";
        final String[] projection = {column};

        try {
            cursor = context.getContentResolver().query(uri, projection,
                    selection, selectionArgs, null);
            if (cursor != null && cursor.moveToFirst()) {
                final int index = cursor.getColumnIndexOrThrow(column);
                return cursor.getString(index);
            }
        } finally {
            if (cursor != null)
                cursor.close();
        }
        return null;
    }

    public static boolean isExternalStorageDocument(Uri uri) {
        return "com.android.externalstorage.documents".equals(uri
                .getAuthority());
    }

    public static boolean isDownloadsDocument(Uri uri) {
        return "com.android.providers.downloads.documents".equals(uri
                .getAuthority());
    }

    public static boolean isMediaDocument(Uri uri) {
        return "com.android.providers.media.documents".equals(uri
                .getAuthority());
    }

    public static boolean isGooglePhotosUri(Uri uri) {
        return "com.google.android.apps.photos.content".equals(uri
                .getAuthority());
    }

    public static void generateNoteOnSD(String sFileName, String sBody) {
        try {
            File root = new File(Environment.getExternalStorageDirectory(),
                    "Notes");
            if (!root.exists()) {
                root.mkdirs();
            }
            File gpxfile = new File(root, sFileName);
            FileWriter writer = new FileWriter(gpxfile);
            writer.append(sBody);
            writer.flush();
            writer.close();
        } catch (IOException ignored) {

        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        b_count.setCount_new(0);
        uniqueCode = UUID.randomUUID().toString();
        Log.d("randomUUID=> ", uniqueCode);
        googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        try {
            fbtn = findViewById(R.id.Flayoutbtn);
            layColor = findViewById(R.id.layColor);
            animFadein = AnimationUtils.loadAnimation(getApplicationContext(),
                    R.anim.blink);
            animsave = AnimationUtils.loadAnimation(getApplicationContext(),
                    R.anim.blinksave);
            animclear = AnimationUtils.loadAnimation(getApplicationContext(),
                    R.anim.blink_clear);
            animclear_new = AnimationUtils.loadAnimation(
                    getApplicationContext(), R.anim.blink_clear_new);
            pref = sqlitewraper.getSecureShared("MyPref");
            save = findViewById(R.id.save_draw);
            Retry = findViewById(R.id.Retry);

            b = new B_new();
            changedListener = this;
            context = this;


            imagecolor = findViewById(R.id.btnColor);
            imgbrush = findViewById(R.id.btnBrush);
            imaeraser = findViewById(R.id.btnErase);
            seekBar = findViewById(R.id.seekBar1);
            layout = findViewById(R.id.Layoutbtn);
            imageView = findViewById(R.id.imageView2);
            lan = findViewById(R.id.ChoosenImageView_lay);

            themecolor = pref.getString("themecolor","");
            if(themecolor.equalsIgnoreCase(""))
            { }
            else {
                save.setBackgroundColor(Color.parseColor(themecolor));
                Retry.setBackgroundColor(Color.parseColor(themecolor));
                layout.setBackgroundColor(Color.parseColor(themecolor));
            }

            imagesFolder = new File(Environment.getExternalStorageDirectory(),
                    "test");
            imagesFolder.mkdirs();
            image = new File(imagesFolder, System.currentTimeMillis() + ".jpg");
            phy_path = image.getAbsolutePath();
            layImg = layout;
            layColor = findViewById(R.id.layColor);
            layErase = findViewById(R.id.layErase);
            layBrush = findViewById(R.id.layBrush);
            azureTextView = findViewById(R.id.azure_text);
            btnEnterManual = findViewById(R.id.btn_entermanul);
            btnExit = findViewById(R.id.btnExit);
            btnRefresh = findViewById(R.id.btnRefresh);
            LinearLayout scanLayout = findViewById(R.id.lay_textrecognize);
            selectedReadingView = findViewById(R.id.selected_reading);
            imageTflite = findViewById(R.id.img_tflite);
            selectedReadingView.setVisibility(View.GONE);

            btnEnterManual.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View view) {
                    TextRecognizationUtils.showEnterManualAlertDialog(easy_draw_new.this, false, null, selectedReadingView);
                }
            });

            btnExit.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View view) {
                    if (!hasNumber) {
                        TextRecognizationUtils.detectedText = "0";
                    } else {
                        TextRecognizationUtils.detectedText = "0";
                    }
                    TextRecognizationUtils.finalTextString = "0";

                    GetHashesFromServerTask getHashesFromServerTask = new GetHashesFromServerTask();
                    getHashesFromServerTask.execute();
                }
            });
            btnRefresh.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View view) {
                    if (lastBitmap != null) {
                        azureTextView.setText("Please wait...");
                        try {
                            gatingImageToText(lastBitmap, detectionType);
                        } catch (IOException | JSONException e) {
                            ComputerVisionDetection.writeLogToFile("Exception: " + e.toString(), "gatingImageToText " + detectionType);
                            //e.printStackTrace();
                        }
                        /*scanTextFromBitmap(lastBitmap);*/
                    } else {
                        ComputerVisionDetection.writeLogToFile("lastBitmap is null ", "btnRefresh ");
                    }

                }
            });

            if (camera_new.isCropMode) {
                if (camera_new.isScanmode) {
                    TextRecognizationUtils.setIntialValues(this);
                    scanLayout.setVisibility(View.VISIBLE);
                    azureTextView.setVisibility(View.VISIBLE);
                    computerVisionDetection = new ComputerVisionDetection();
                    save.setVisibility(View.GONE);
                    layout.setVisibility(View.GONE);
                    inittfLIteModel();

                    radioGroup = findViewById(R.id.radio_calltype);
                    tvOldImage = findViewById(R.id.tvOldImage);
                    radioGroup.clearCheck();

                    radioBtnAnalog = findViewById(R.id.radio_normalread);
                    radioBtnSeven = findViewById(R.id.radio_sevensegment);

                    radioGroup.setOnCheckedChangeListener((group, checkedId) -> {
                        RadioButton rb = group.findViewById(checkedId);
                        if (null != rb && checkedId > -1) {
                            //  Toast.makeText(easy_draw_new.this, rb.getText(), Toast.LENGTH_SHORT).show();
                            String selectedType = rb.getText().toString();

                            if (isAPIcalled) {
                                if (selectedType.equalsIgnoreCase("analog")) {
                                    Log.d("##USER_SELECTED", "ANALOG");
                                    userSelectedText("normal", lastBitmap);
                                } else if (selectedType.equalsIgnoreCase("seven segment")) {

                                    Log.d("##USER_SELECTED", "DIGITAL");
                                    userSelectedText("seven", lastBitmap);
                                }
                            }
                        }
                    });
                }
            }


            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

            pref = sqlitewraper.getSecureShared("MyPref");

            pref.putString("photo_path", ""); // Saving string
            pref.commit();
            String time1 = pref.getString("time", "k2");

            String time2 = pref.getString("time2", "k2");
            b_write = pref.getString("b_write", "k2");

            Bundle Extras = getIntent().getExtras();

            f_image = (File) getIntent().getSerializableExtra("File");

            b_write = Extras.getString("b_write", "k2");
            width = Extras.getString("width");
            height = Extras.getString("height");
            quality = Extras.getString("quality");
            flagdraw = Extras.getString("flagdraw");
            drawflag = Extras.getString("drawflag");
            picdevicelat = Extras.getString("picclicklat");
            picdevicelng = Extras.getString("picclicklng");
            cameraviewid = Extras.getInt("cameraview");
            serverWidth = Integer.parseInt(Extras.getString("serverwidth"));
            serverHeight = Integer.parseInt(Extras.getString("serverheight"));
            hasResponse = Extras.getInt("hasResponse", -2);
            canInsert = Extras.getInt("canInsert", -2);
            MFtext = Extras.getInt("MFtext", 0);
            SMText = Extras.getString("SMText", "");
            info = Extras.getString("info","");
            max_file_size = Extras.getString("max_file_size","");
            if (hasResponse == 0) {
                uniqueCode = Extras.getString("uniqueId");// 73d2a32c-d39e-410d-96f0-a3a3d4d6d03e
            }
            int ShowOldImage = Extras.getInt("ShowOldImage", -2);
            if (ShowOldImage != 1 && ShowOldImage != 2) {
                capture_image();
            }

            imaeraser.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View v) {
                    final DrawingView mDrawingView2 = new DrawingView(context,
                            alteredBitmap);
                    AlertDialog.Builder eraseDialog = new AlertDialog.Builder(
                            context);
                    eraseDialog.setIcon(R.drawable.eraser);
                    eraseDialog.setTitle(Html
                            .fromHtml("<font color='#337ab7'>Erase Drowing</font>"));
                    eraseDialog.setMessage("Are You Sure You Want To Erase ?");
                    eraseDialog.setPositiveButton("Yes",
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog,
                                                    int which) {
                                    // System.out.println("eraseAll() Method Call");
                                    lan.removeView(mydrawingView);
                                    alteredBitmap = Bitmap.createBitmap(
                                            bmp.getWidth(), bmp.getHeight(),
                                            bmp.getConfig());
                                    Bitmap mutableBitmap = bmp.copy(
                                            Bitmap.Config.ARGB_8888, true);
                                    GetColor.setStrockWidth(5);
                                    GetColor.setDefaultBrushSize(GetColor
                                            .getStrockWidth());
                                    DrawingView mDrawingView1 = new DrawingView(
                                            context, mutableBitmap);
                                    mDrawingView1.eraseAll();
                                    lan.addView(mDrawingView1);
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

            imgbrush.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View v) {

                    seekBar.setProgress(GetColor.getDefaultBrushSize());
                    seekBar.setMax(20);
                    seekBar.setOnSeekBarChangeListener(new OnSeekBarChangeListener() {

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
            imagecolor.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View arg0) {

                    HSVColorPickerDialog cpd = new HSVColorPickerDialog(
                            easy_draw_new.this, 0xFF4488CC,
                            new OnColorSelectedListener() {
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

            Retry.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View arg0) {
                    // TODO Auto-generated method stub
                    try {


                        final DrawingView mDrawingView2 = new DrawingView(context,
                                alteredBitmap);
                        AlertDialog.Builder deleteDialog = new AlertDialog.Builder(
                                context);
                        deleteDialog.setIcon(R.drawable.camera);
                        deleteDialog.setTitle(Html
                                .fromHtml("<font color='#337ab7'>Recapture Image</font>"));
                        deleteDialog
                                .setMessage("Are You Sure You Want To Recapture Image ?");
                        deleteDialog.setPositiveButton("Yes",
                                new DialogInterface.OnClickListener() {
                                    public void onClick(DialogInterface dialog,
                                                        int which) {
                                        // onCreate(new Bundle());
                                        // anim_count = 0;
                                        // lanCamera_int = 0;
                                        data d = new data();
                                        d.setRet(1);

                                        if (flagdraw.equals("1")) {
                                            imagesFolder = new File(
                                                    Environment.getExternalStorageDirectory(), "Easy_form");

                                            imagesFolder.mkdirs();
                                            //<----
                                            image = new File(imagesFolder, System.currentTimeMillis() + ".jpg");
                                            phy_path = image.getAbsolutePath();
                                            outputFileUri = Uri.fromFile(image);

                                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                                outputFileUri = FileProvider.getUriForFile(easy_draw_new.this, getApplicationContext().getPackageName() + ".provider", image);
                                                // only for gingerbread and newer versions
                                            }

                                            pref.putString("outputuri", phy_path); // Saving
                                            // string
                                            pref.commit();

                                            startCameraActivity();
                                        } else {
                                            Intent i;
                                            if (camera_new.isCropMode) {
                                                i = new Intent(easy_draw_new.this,
                                                        NewCameraActivity.class);
                                            } else {
                                                i = new Intent(easy_draw_new.this,
                                                        MakePhotoActivity.class);
                                            }
                                            i.putExtra("b_write", b_write);
                                            i.putExtra("width", width);
                                            i.putExtra("quality", quality);
                                            i.putExtra("height", height);
                                            i.putExtra("info", info);
                                            i.putExtra("max_file_size",max_file_size);
                                            startActivityForResult(i, 141);
//                                        finish();
                                        }
                                        dialog.dismiss();
                                    }
                                });
                        deleteDialog.setNegativeButton("Cancel",
                                new DialogInterface.OnClickListener() {
                                    public void onClick(DialogInterface dialog,
                                                        int which) {
                                        dialog.cancel();
                                    }
                                });
                        deleteDialog.show();
                    } catch (Exception e) {
                        //////e.printStackTrace();
                        Log.d("##hell", "killer :" + e.toString());
                    }
                }

            });
            save.setOnClickListener(new OnClickListener() {
                int i = 0;

                @Override
                public void onClick(View v) {

                    if (camera_new.isScanmode) {
                        String finalStringAzure = TextRecognizationUtils.finalTextString;

                        if (finalStringAzure.equalsIgnoreCase("")) {
                            Toast.makeText(easy_draw_new.this, "Please select at least one value or enter manual value.", Toast.LENGTH_LONG).show();
                        } else {
                            Toast.makeText(easy_draw_new.this, "Selected value is: " + finalStringAzure, Toast.LENGTH_LONG).show();
                            TripMapUtils.setIsBypassActivity(true);
                            GetHashesFromServerTask getHashesFromServerTask = new GetHashesFromServerTask();
                            getHashesFromServerTask.execute();
                        }
                    } else {
                        TripMapUtils.setIsBypassActivity(true);
                        GetHashesFromServerTask getHashesFromServerTask = new GetHashesFromServerTask();
                        getHashesFromServerTask.execute();
                    }
                }
            });
            if (ShowOldImage == 1) {
                getDataFromDatabase(true, false);
            }
            if (ShowOldImage == 2) {
                getDataFromDatabase(true, true);
            }
        } catch (Exception e) {
            writeToFile(e.toString(), "");
        }
    }

    int hasResponse = -2;
    int canInsert = -2;
    int MFtext = 0;
    String SMText;

    protected void startCameraActivity() {

        File photoFile = null;
        try {
            photoFile = createImageFile();
        } catch (Exception e) {
            //////e.printStackTrace();
        }

        Intent cameraIntent = new Intent(
                MediaStore.ACTION_IMAGE_CAPTURE);

        if (photoFile != null) {

            path_mm += "path:" + phy_path;
            cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, outputFileUri);
            pref.putString("outputuri", phy_path); // Saving
            // string
            pref.commit();

        } else {

            path_mm += "path:" + phy_path;
            cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, outputFileUri);

            pref.putString("outputuri", phy_path); // Saving
            // string
            pref.commit();
            path_mm += "\n path_else:" + phy_path;

        }

        this.startActivityForResult(cameraIntent, 101);

    }

    private File createImageFile() throws IOException {
        // Create an image file name
        @SuppressLint("SimpleDateFormat") String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss")
                .format(new Date());
        String imageFileName = "Easy_" + timeStamp + "_";
        File storageDir = Environment
                .getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(imageFileName, /* prefix */
                ".jpg", /* suffix */
                storageDir /* directory */
        );
        // Save a file: path for use with ACTION_VIEW intents
        mCurrentPhotoPath = "file:" + image.getAbsolutePath();
        return image;
    }

    protected void onResume() {
        super.onResume();
        GetColor color = new GetColor();
        color.setColorValue(ColorAh);
        //check device time auto or manual and stop user if it is manual
        String checkDeviceTime = sqlitewraper.context.getResources().getString(R.string.RestrictDeviceTime);
        if(checkDeviceTime.equalsIgnoreCase("true"))
        {
            checkDeviceTime();
        }
    }

    public void checkDeviceTime() {
        try {
            int hh = Settings.Global.getInt(getContentResolver(), Settings.Global.AUTO_TIME);
            Log.d("##TIMEZONE", String.valueOf(hh));
            if (hh == 0) {
                showAlertDialogTimeDetect(this, "Please set time as Automatic/Network provided time from time setting.");
            }
        } catch (Settings.SettingNotFoundException e) {
            e.printStackTrace();
            Log.d("##TIMEZONE", String.valueOf(e.getMessage()));
        }
    }

    public void showAlertDialogTimeDetect(Activity activity, String msg) {
        final Dialog dialog = new Dialog(activity);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false);
        dialog.setContentView(R.layout.timedetection_dialog);

        TextView text = dialog.findViewById(R.id.text_dialog);
        text.setText(msg);

        Button dialogButton = dialog.findViewById(R.id.btn_dialog);
        dialogButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialog.dismiss();
                startActivityForResult(new Intent(android.provider.Settings.ACTION_DATE_SETTINGS), 0);
            }
        });
        if (!dialog.isShowing()) {
            dialog.show();
        }
    }


    public void onWindowFocusChanged(boolean hasFocus) {

    }

    @RequiresApi(api = Build.VERSION_CODES.KITKAT)
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 141) {
            com.sky.atc.easyformse.data d = new data();
            if (d.getRet() == 1 && data == null) {

                if (resultCode == Activity.RESULT_OK) {
                    d.setRet(0);
                    String status = pref.getString("photo_path", "");
                    Bundle b = new Bundle();
                    b.putString("status", status);
                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_OK, intent1);
                    finish();
                } else {

                    Bundle b = new Bundle();
                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_CANCELED, intent1);
                    finish();
                }
            } else {

                b_count.setCount_new(1);
                // retour de la version utilisant le sample de imense alpr
                if (resultCode == Activity.RESULT_OK) { // 0:ok
                    Bundle bundle = data.getExtras();
                    String status = null;
                    if (bundle != null) {
                        status = bundle.getString("status");
                    }
                    ret = bundle.getInt("ret");

                    pref.putString("photo_path", status); // Saving string
                    pref.commit(); // commit changes

                    Bundle b = new Bundle();

                    b.putString("status", status);
                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_OK, data);
                    b_count.setPath_final(status);

                    pref.putString("photo_path", status); // Saving
                    pref.commit();
                    finish();


                } else if (data == null && resultCode != Activity.RESULT_CANCELED) {

                    if (b_count.getCount_new() == 1) {

                        Bundle b = new Bundle();

                        b.putString("status", b_count.getPath_final());
                        Intent intent1 = new Intent();
                        intent1.putExtras(b);


                        if (b_count.getPath_final() == null) {
                            setResult(RESULT_CANCELED, intent1);
                        } else {
                            setResult(RESULT_OK, intent1);
                        }

                        pref.putString("photo_path", b_count.getPath_final()); // Saving
                        // string

                        pref.commit();

                    } else {

                        Bundle b = new Bundle();
                        Intent intent1 = new Intent();
                        intent1.putExtras(b);
                        setResult(RESULT_CANCELED, intent1);
                    }
                    finish();

                } else {

                    Bundle b = new Bundle();

                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_CANCELED, intent1);

                    finish();

                }

            }
        }

        if (resultCode == Activity.RESULT_OK && requestCode == 101) {

            try {

                path_mm = "Onsuccess_resultcode";
                generateNoteOnSD("photo34.txt", path_mm);
                Bitmap photo = null;
                if (data == null || data.getData() == null) {

                    path_mm += "Onsuccess_bitmap";
                    generateNoteOnSD("photo35.txt", path_mm);
                    bitmap();

                } else {
                    path_mm += "Onfail_bitmap";
                    generateNoteOnSD("photo36.txt", path_mm);


                    Uri u1 = data.getData();

                    generateNoteOnSD("photo40.txt", "null on u1");

                    path_mm += u1.toString();
                    generateNoteOnSD("photo37.txt", path_mm);

                    String path = getPath(sqlitewraper.context, u1);

                    path_mm += "After get path" + path;


                    pref.putString("outputuri", path); // Saving

                    path_mm += "\n After_camera_capture_Else:" + path;

                    // string
                    pref.commit();

                    photo = MediaStore.Images.Media.getBitmap(
                            this.getContentResolver(), data.getData());
                    bitmap();
                }
                pref = sqlitewraper.getSecureShared("MyPref");
                finish();
            } catch (Exception ex) {


                generateNoteOnSD("photo2.txt", path_mm + "\n" +
                        ex.toString());

                Bundle b = new Bundle();
                b.putString("result", ex.toString());
                Intent intent = new Intent();
                intent.putExtras(b);
                setResult(RESULT_CANCELED, intent);
                finish();
            }
        }

        if (requestCode == 4812) {
            setResult(resultCode, data);
            finish();
        }


    }

    public boolean onTouch(View v, MotionEvent event) {
        int action = event.getAction();
        switch (action) {
            case MotionEvent.ACTION_DOWN:

                downx = event.getX();
                downy = event.getY();
                break;
            case MotionEvent.ACTION_MOVE:

                upx = event.getX();
                upy = event.getY();
                canvas.drawLine(downx, downy, upx, upy, paint);
                imageView.invalidate();
                downx = upx;
                downy = upy;
                break;
            case MotionEvent.ACTION_UP:

                upx = event.getX();
                upy = event.getY();
                canvas.drawLine(downx, downy, upx, upy, paint);
                imageView.invalidate();
                break;
            case MotionEvent.ACTION_CANCEL:
                break;
            default:
                break;
        }
        return true;
    }

    @Override
    public void onClick(View arg0) {
    }

    void capture_image() {

        Uri image_file;
        try {
            if (count > 0) {
                bmp.recycle();
            }
            try {

                image_file = Uri.fromFile(f_image);
                BitmapFactory.Options bmpFactoryOptions = new BitmapFactory.Options();
                bmpFactoryOptions.inJustDecodeBounds = true;
                if (camera_new.isScanmode) {
                    bmpFactoryOptions.inSampleSize = 1;
                } else {
                    bmpFactoryOptions.inSampleSize = 2;
                }
                bmpFactoryOptions.inPreferredConfig = Bitmap.Config.ARGB_8888;
                bmpFactoryOptions.inJustDecodeBounds = false;
                bmp = BitmapFactory.decodeStream(getContentResolver().openInputStream(image_file), null, bmpFactoryOptions);


                int rotation = getRotation(this, Uri.fromFile(f_image));


                generateNoteOnSD("easydraw11.txt", "before Decode Stream");

                if (!camera_new.isCropMode) {
                    if (cameraviewid == -1) {
                        if (flagdraw.equals("1")) {
                            bmp = rotateImage(bmp, 0);
                        } else {
                            bmp = rotateImage(bmp, 90);
                        }
                    } else {
                        if (cameraviewid == 0) {
                            if (flagdraw.equals("1")) {
                                bmp = rotateImage(bmp, 0);
                            } else {
                                bmp = rotateImage(bmp, 90);
                            }
                        } else {
                            if (flagdraw.equals("1")) {
                                bmp = rotateImage(bmp, 0);
                            } else {
                                bmp = rotateImage(bmp, 270);
                            }
                        }
                    }
                }


                ExifInterface ei = new ExifInterface(f_image.getAbsolutePath());
                bmp = imageOreintationValidator(bmp, f_image.getAbsolutePath());

                generateNoteOnSD("easydraw12.txt", "after getting bitmap");
                alteredBitmap = Bitmap.createBitmap(bmp.getWidth(), bmp.getHeight(), bmp.getConfig());

                Bitmap mutableBitmap = bmp.copy(Bitmap.Config.ARGB_8888, true);
                GetColor color2 = new GetColor();
                color2.setColorValue(-54784);
                DrawingView mDrawingView = new DrawingView(this, mutableBitmap);
                b.setMutableBitmap(mutableBitmap);
                b.setB(mutableBitmap);

                lastBitmap = mutableBitmap;

                imageTflite.setImageBitmap(lastBitmap);

                scanTextFromBitmap(mutableBitmap);

                count++;
                if (count > 0) {
                    if (camera_new.isScanmode) {
                        imageView.setImageBitmap(mutableBitmap);
                    } else {
                        lan.removeView(mydrawingView);
                        lan.addView(mDrawingView);
                    }

                } else {
                    if (camera_new.isScanmode) {
                        imageView.setImageBitmap(mutableBitmap);
                    } else {
                        lan.addView(mDrawingView);
                    }
                }

                mydrawingView = mDrawingView;
            } catch (Exception e) {
                Log.v("ERROR", e.toString());

                final Writer result = new StringWriter();
                final PrintWriter printWriter = new PrintWriter(result);
                String stacktrace = result.toString();
                printWriter.close();
                generateNoteOnSD("easydraw14.txt", stacktrace);
            }

        } catch (Exception e) {

            writeToFile(e.toString(), "");
            Bundle b = new Bundle();
            b.putString("result", e.toString());
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);
            finish();

        }

    }

    private void scanTextFromBitmap(Bitmap mutableBitmap) {
        try {
            if (camera_new.isCropMode) {
                if (camera_new.isScanmode) {
                    gatingImageToText(mutableBitmap);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void gatingImageToText(Bitmap mutableBitmap, String detectionType) throws IOException, JSONException {
        String textStringMain;
        if (detectionType.equalsIgnoreCase("seven")) {
            radioBtnSeven.setChecked(true);
            try {
                if (canInsert == 1 && (hasResponse == 1 || hasResponse == -2)) {
                    saveValuesToDatabase("", "seven", uniqueCode);
                }
                textStringMain = computerVisionDetection.computerVision7SegReqEasyform(mutableBitmap, uniqueCode);
                vision7SegReqEasyfResponse(textStringMain, mutableBitmap);
            } catch (Exception e) {
                ComputerVisionDetection.writeLogToFile(e.toString(), "computerVision7SegReqEasyform Call");
                Log.d("Error ", e.toString());
                vision7SegReqEasyfResponse("", mutableBitmap);
            }
            isAPIcalled = true;
        } else if (detectionType.equalsIgnoreCase("text")) {
            if (canInsert == 1 && (hasResponse == 1 || hasResponse == -2)) {
                saveValuesToDatabase("", "text", uniqueCode);
            }
            radioBtnAnalog.setChecked(true);
            selectedReadingView.setText("Detection Type: AZURE");
            new LongOperation().execute(mutableBitmap);
            isAPIcalled = true;

        }

    }


    private void gatingImageToText(Bitmap mutableBitmap) throws IOException, JSONException {
        Bitmap croppedBitmap = resizeBitmapImageForFitSquare(mutableBitmap, TF_OD_API_INPUT_SIZE);

        if (AzureUtils.questionID.equals("9") || AzureUtils.questionID.equals("304")) {
            String textStringMain;
            radioBtnSeven.setChecked(true);
            try {
                if (canInsert == 1 && (hasResponse == 1 || hasResponse == -2)) {
                    saveValuesToDatabase("", "seven", uniqueCode);
                }
                textStringMain = computerVisionDetection.computerVision7SegReqEasyform(mutableBitmap, uniqueCode);
                vision7SegReqEasyfResponse(textStringMain, mutableBitmap);
            } catch (Exception e) {
                ComputerVisionDetection.writeLogToFile(e.toString(), "computerVision7SegReqEasyform Call");
                Log.d("Error ", e.toString());
                vision7SegReqEasyfResponse("", mutableBitmap);
            }
            isAPIcalled = true;
        } else {
            String textStringMain = computerVisionDetection.gettfLiteDetection(croppedBitmap);
            Log.d("randomUUID 2:=> ", uniqueCode);
            Log.d("randomUUID 2:=> ", textStringMain);
            if (!textStringMain.equalsIgnoreCase("")) {
                radioBtnSeven.setChecked(true);
                try {
                    if (canInsert == 1 && (hasResponse == 1 || hasResponse == -2)) {
                        saveValuesToDatabase("", "seven", uniqueCode);
                    }
                    textStringMain = computerVisionDetection.computerVision7SegReqEasyform(mutableBitmap, uniqueCode);
                    vision7SegReqEasyfResponse(textStringMain, mutableBitmap);
                } catch (Exception e) {
                    ComputerVisionDetection.writeLogToFile(e.toString(), "computerVision7SegReqEasyform Call");
                    Log.d("Error ", e.toString());
                    vision7SegReqEasyfResponse("", mutableBitmap);
                }
                isAPIcalled = true;
            } else {
                if (canInsert == 1 && (hasResponse == 1 || hasResponse == -2)) {
                    saveValuesToDatabase("", "text", uniqueCode);
                }
                radioBtnAnalog.setChecked(true);
                selectedReadingView.setText("Detection Type: AZURE");
                new LongOperation().execute(mutableBitmap);
                isAPIcalled = true;

            }
        }
    }

    private void vision7SegReqEasyfResponse(String responseString, Bitmap mutableBitmap) {
        String status;
        String secondUrl, message = null;
        try {
            JSONArray jsonArray = new JSONArray(responseString);
            JSONObject jsonObject = jsonArray.getJSONObject(0);
            status = jsonObject.getString("statu" +
                    "" +
                    "" +
                    "s");
            message = jsonObject.getString("message");
            if (jsonObject.has("data")) {
                secondUrl = jsonObject.getString("data");
            } else {
                secondUrl = null;
            }
        } catch (JSONException e) {
            ComputerVisionDetection.writeLogToFile(e.toString(), "vision7SegReqEasyfResponse");
            status = "10";
            secondUrl = null;

        }
        if (status.equalsIgnoreCase("1")) {
            if (secondUrl != null) {
                //  Log.d("secondUrl", secondUrl + " " + URLUtil.isHttpsUrl(secondUrl));
                if (!secondUrl.equalsIgnoreCase("")) {
                    updateValuesToDatabase(secondUrl, "seven", uniqueCode);
                    sevenString = get7SegStringfromResponse(secondUrl, mutableBitmap);
                    if (sevenString == null) {
                        btnRefresh.setVisibility(View.VISIBLE);
                    }
                    if (!sevenString.equalsIgnoreCase("")) {
                        setSpanabbleText(sevenString);
                        selectedReadingView.setText("Detection Type: TFLITE");
                        imageTflite.setVisibility(View.GONE);
                        imageTflite.setImageBitmap(lastBitmap);
                        tvOldImage.setVisibility(View.GONE);
                    } else {
                        azureTextView.setText("OCR is Unable to detect reading, Please enter manually.");
                        TextRecognizationUtils.inputType = "manual";
                        btnExit.setVisibility(View.VISIBLE);
                        btnRefresh.setVisibility(View.GONE);
                        tvOldImage.setVisibility(View.GONE);
                    }
                } else {
                    azureTextView.setText("OCR is Unable to detect reading, Please enter manually.");
                    TextRecognizationUtils.inputType = "manual";
                    btnExit.setVisibility(View.VISIBLE);
                    btnRefresh.setVisibility(View.GONE);
                    tvOldImage.setVisibility(View.GONE);
                }
            }
        } else if (status.equalsIgnoreCase("3")) {
            azureTextView.setText(secondUrl);
            btnExit.setVisibility(View.VISIBLE);
            btnRefresh.setVisibility(View.GONE);
            tvOldImage.setVisibility(View.GONE);
        } else if (status.equalsIgnoreCase("4")) {
            if (message != null) {
                showAlertDialogAndExitApp(message);//logout_on_click_online
            } else {
                showAlertDialogAndExitApp("Authentication Failed!");
            }
        } else if (status.equalsIgnoreCase("9")) {
            azureTextView.setText(secondUrl);
            TextRecognizationUtils.inputType = "LimitReached";
            btnExit.setVisibility(View.GONE);
            btnRefresh.setVisibility(View.GONE);
            deleteFromDatabase(uniqueCode);
            showAlertDialogWithMessage(secondUrl);
        } else if (status.equalsIgnoreCase("10")) {
            azureTextView.setText("Network Error!. Please Refresh");
            btnRefresh.setVisibility(View.VISIBLE);
            btnExit.setVisibility(View.GONE);
            tvOldImage.setVisibility(View.GONE);
        } else {
            azureTextView.setText(secondUrl);
            btnExit.setVisibility(View.VISIBLE);
            btnRefresh.setVisibility(View.GONE);
            tvOldImage.setVisibility(View.GONE);
        }
    }


    private String get7SegStringfromResponse(String responseString, Bitmap croppedBitmap) {

        StringBuilder finalString = null;


        try {
            JSONObject mainObj = new JSONObject(responseString);

            JSONArray predictionArray = mainObj.getJSONArray("predictions");

            ArrayList<RectangleData> rectFS = new ArrayList<>();

            for (int i = 0; i < predictionArray.length(); i++) {

                JSONObject innerObj = predictionArray.getJSONObject(i);

                double probability = innerObj.getDouble("probability");
                String detectedText = innerObj.getString("tagName");
                if ((detectedText.equalsIgnoreCase(".") && probability > 0.8) ||
                        (!detectedText.equalsIgnoreCase(".") && probability > 0.6)) {


                    Log.d("##7SEG", detectedText);

                    JSONObject boundingBoxObject = innerObj.getJSONObject("boundingBox");

                    Log.d("##7SEG_BOUNDING_BOX", String.valueOf(boundingBoxObject));

                    float left = ((float) boundingBoxObject.getDouble("left")) * croppedBitmap.getWidth();
                    float top = ((float) boundingBoxObject.getDouble("top")) * croppedBitmap.getHeight();
                    float width = (((float) boundingBoxObject.getDouble("width")) * croppedBitmap.getWidth()) + left;
                    float height = (((float) boundingBoxObject.getDouble("height")) * croppedBitmap.getHeight()) + top;


                    RectF rectF = new RectF(left, top, width, height);

                    RectangleData rectangleData = new RectangleData(rectF.left, rectF.top, rectF.right, rectF.bottom, detectedText);
                    rectangleData.setProbability(probability);
                    rectFS.add(rectangleData);

                    // rectangeOnImage(croppedBitmap, rectangleData);
                }

            }

            Collections.sort(rectFS, new Comparator<RectangleData>() {
                @Override
                public int compare(RectangleData rectangleData, RectangleData t1) {
                    return Float.compare(rectangleData.getLeft(), t1.getLeft());
                }
            });
            finalString = new StringBuilder();
            for (int i = 0; i < rectFS.size(); i++) {
                RectangleData rectangleOne = rectFS.get(i);
                if (rectangleOne.isCanGet()) {
                    for (int n = i; n < rectFS.size(); n++) {
                        if (i != n) {
                            RectangleData rectangleTwo = rectFS.get(n);
                            RectF rectFOne = new RectF(rectangleOne.getLeft(), rectangleOne.getTop(), rectangleOne.getRight(), rectangleOne.getBottom());
                            RectF rectFTwo = new RectF(rectangleTwo.getLeft(), rectangleTwo.getTop(), rectangleTwo.getRight(), rectangleTwo.getBottom());
                            boolean isOverlap = isRectangleOverlap(rectFOne, rectFTwo);
                            if (isOverlap) {
                                if (rectangleOne.getProbability() < rectangleTwo.getProbability()) {
                                    rectangleOne.setCanGet(false);
                                } else {
                                    rectangleTwo.setCanGet(false);
                                }
                            }
                        }
                    }
                }
            }
            Log.d("##AllData::=> ", rectFS.toString());
           /* for (int i = 0; i < rectFS.size(); i++) {
                RectangleData rectangleOne = rectFS.get(i);
                if (rectangleOne.isCanGet())
                    finalString.append(rectangleOne.getDetectedText());
            }*/


            int widthSum = 0;
            int itemCount = 0;
            for (int i = 0; i < rectFS.size(); i++) {
                RectangleData rectangleOne = rectFS.get(i);
                if (rectangleOne.isCanGet()) {
                    if (!rectangleOne.getDetectedText().equals(".")) {
                        widthSum += (rectangleOne.getRight() - rectangleOne.getLeft());
                        itemCount++;
                    }
                }
            }
            Log.d("######width::=> ", String.valueOf(widthSum));
            float widthAvg;
            try {
                widthAvg = (float) ((widthSum / itemCount) * 0.65);
            } catch (Exception e) {
                widthAvg = 10;
            }

            Log.d("######width::=> ", String.valueOf(widthAvg));
            float lastleft = 0;
            for (int i = 0; i < rectFS.size(); i++) {
                RectangleData rectangleOne = rectFS.get(i);
                if (rectangleOne.isCanGet()) {

                    float deff = rectangleOne.getLeft() - lastleft;
                    Log.d("######width::=> ", String.valueOf(deff));
                    if (deff > widthAvg) {
                        finalString.append(" ");
                    }
                    finalString.append(rectangleOne.getDetectedText());
                }

                lastleft = rectangleOne.getRight();
            }
        } catch (Exception e) {
            e.printStackTrace();
            Log.d("##7SEG", e.getMessage());
        }

        return finalString.toString();
    }

    public boolean isRectangleOverlap(RectF rec1, RectF rec2) {
        Log.d("##isRectangleOverlap", "rec1: " + rec1.right + " > rec2: " + rec2.left + " =" + (rec1.right > rec2.left));

        float overlapValues = (rec1.right - rec2.left) * 100;
        Log.d("##Overlap values : ", String.valueOf(overlapValues / 100));

        float overlapPar = overlapValues / (rec2.right - rec2.left);
        Log.d("##Overlap values : ", String.valueOf(overlapPar));

        return overlapPar > 60;
    }

    private void userSelectedText(String selectionType, Bitmap mutableBitmap) {

        try {
            if (selectionType.equalsIgnoreCase("seven")) {

                Bitmap croppedBitmap = resizeBitmapImageForFitSquare(mutableBitmap, TF_OD_API_INPUT_SIZE);
                String textStringMain = computerVisionDetection.gettfLiteDetection(croppedBitmap);

                if (!textStringMain.equalsIgnoreCase("")) {
                    if (sevenString == null) {
                        try {
                            if (canInsert == 1 && (hasResponse == 1 || hasResponse == -2)) {
                                saveValuesToDatabase("", "seven", uniqueCode);
                            }
                            textStringMain = computerVisionDetection.computerVision7SegReqEasyform(mutableBitmap, uniqueCode);
                            vision7SegReqEasyfResponse(textStringMain, mutableBitmap);
                        } catch (Exception e) {
                            Log.d("Error ", e.toString());
                            vision7SegReqEasyfResponse("", mutableBitmap);
                        }
                    }
                }

            } else if (selectionType.equalsIgnoreCase("normal")) {

                imageTflite.setVisibility(View.GONE);

                selectedReadingView.setText("Detection Type: AZURE");
                if (normalString == null) {
                    if (canInsert == 1 && (hasResponse == 1 || hasResponse == -2)) {
                        saveValuesToDatabase("", "text", uniqueCode);
                    }
                    new LongOperation().execute(mutableBitmap);
                } else {
                    String textString = normalString;
                    if (!textString.equalsIgnoreCase("")) {
                        setSpanabbleText(textString);
                    } else {
                        azureTextView.setText("OCR is Unable to detect reading, Please enter manually.");
                        btnExit.setVisibility(View.VISIBLE);
                        btnRefresh.setVisibility(View.GONE);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    boolean hasNumber = false;

    private void setSpanabbleText(String textString) {

        textString = addSpacesInChar(textString.trim());


        Log.d("##SINGLE_LINE_STRINGTEX", textString);

        String[] lines = textString.split("\\r?\\n");

        Log.d("##SINGLE_LINE_SIZE", String.valueOf(lines.length));


        String singleLineOfString = "";
        String newCombinedTextString = "";
        StringBuilder allString = new StringBuilder();
        StringBuilder allNNumbers = new StringBuilder();
        for (String line : lines) {
            allString.append(line);
            String brackettextString = getNumberFromString(line);
            String finalBracketString;
            if (!brackettextString.equalsIgnoreCase("")) {
                finalBracketString = "(" + brackettextString + ")";
            } else {
                finalBracketString = "";
            }

            singleLineOfString = line + finalBracketString;
            Log.d("##SINGLE_LINE_STRING", singleLineOfString);
            newCombinedTextString = newCombinedTextString + singleLineOfString + "\n";
        }
        Log.d("##SINGLE_LINE_SIZE::: ", allString.toString());
        if (lines.length > 1) {
            allNNumbers.append(getNumberFromString(allString.toString()));
            if (!allNNumbers.toString().equalsIgnoreCase(""))
                newCombinedTextString += "(" + allNNumbers.toString() + ")";
        }
        Log.d("##SINGLE_COMBINED", newCombinedTextString);
        textString = newCombinedTextString;
        textString = textString.replaceAll("\\s*\\.\\s*", ".");

        TextRecognizationUtils.detectedText = textString;


        Spannable wordtoSpan = new SpannableString(textString);
        Pattern regex = Pattern.compile("(\\d+(?:\\.\\d+)?)");
        Matcher matcher = regex.matcher(textString);


        Log.d("##hasNumber", String.valueOf(hasNumber));
        while (matcher.find()) {
            System.out.println(matcher.group(1));
            Log.d("##TEXT_NUMBER", matcher.group(1));
            hasNumber = true;
            ClickableSpan spanText = new ClickableSpan() {
                @Override
                public void onClick(@NonNull View textView) {
                    TextView tv = (TextView) textView;

                    Spanned s = (Spanned) tv.getText();
                    int start = s.getSpanStart(this);
                    int end = s.getSpanEnd(this);
                    Toast.makeText(easy_draw_new.this, s.subSequence(start, end), Toast.LENGTH_SHORT).show();
                    TextRecognizationUtils.showEnterManualAlertDialog(easy_draw_new.this, true, String.valueOf(s.subSequence(start, end)), selectedReadingView);
                }
            };
            wordtoSpan.setSpan(spanText, matcher.start(), matcher.end(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);

        }
        /*for (char c : textString.replace("\\r?\\n","").toCharArray()) {
            if (Character.isDigit(c)) {
                Log.d("##hasNumber char", String.valueOf(c));
                hasNumber = true;
                break;
            }
        }*/
        Log.d("##hasNumber 2", String.valueOf(hasNumber));
        if (!hasNumber) {
            btnExit.setVisibility(View.VISIBLE);
            TextRecognizationUtils.inputType = "manual";
            Log.d("##hasNumber if 2", String.valueOf(hasNumber));
        } else {
            Log.d("##hasNumber else 2", String.valueOf(hasNumber));
            btnExit.setVisibility(View.GONE);
        }
        azureTextView.setText(wordtoSpan);


        azureTextView.setMovementMethod(LinkMovementMethod.getInstance());
        LinearLayout scanLayout = findViewById(R.id.lay_textrecognize);
        scanLayout.setVisibility(View.VISIBLE);
        btnEnterManual.setVisibility(View.GONE);
    }


    public Bitmap addPaddingTopForBitmap(Bitmap bitmap, int paddingTop) {
        Bitmap outputBitmap = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight() + paddingTop, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(outputBitmap);
        canvas.drawColor(Color.WHITE);
        canvas.drawBitmap(bitmap, 0, paddingTop, null);
        return outputBitmap;
    }

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

    @Override
    public void colorChanged(String key, int color) {
        System.out.print("color" + color);
        GetColor colorpaint = new GetColor();
        colorpaint.setColorValue(color);
        colorpaint.setDefaultColor(colorpaint.getColorValue());
        Toast.makeText(getApplicationContext(), "Brush Color Selected",
                Toast.LENGTH_SHORT).show();
    }


    @Override
    public void onProgressChanged(SeekBar seekBar, int progress,
                                  boolean fromUser) {
        Toast.makeText(getApplicationContext(),
                        "Selected Brush Size Is: " + progress, Toast.LENGTH_SHORT)
                .show();
    }

    @Override
    public void onStartTrackingTouch(SeekBar seekBar) {
        // TODO Auto-generated method stub
    }

    @Override
    public void onStopTrackingTouch(SeekBar seekBar) {
        // TODO Auto-generated method stub
    }

    @Override
    public void onAnimationEnd(Animation animation) {
        if (lanCamera_int == 0) {
            lanCamera_int++;
            layColor.setAnimation(null);
            layErase.setVisibility(View.VISIBLE);
            layErase.startAnimation(animsave);

        } else if (lanCamera_int == 1) {
            lanCamera_int++;
            layColor.setAnimation(null);
            layErase.setAnimation(null);
            layBrush.setVisibility(View.VISIBLE);
            layBrush.startAnimation(animFadein);

        } else if (lanCamera_int == 2) {
            layBrush.setAnimation(null);
            lanCamera_int++;

        } else if (lanCamera_int == 3) {
            layColor.startAnimation(animclear);
            lanCamera_int++;

        } else if (lanCamera_int == 4) {
            layColor.setAnimation(null);
            layColor.setVisibility(View.GONE);
            // layErase.setAnimation(animclear_new);
            layErase.startAnimation(animclear_new);
            lanCamera_int++;

        } else if (lanCamera_int == 5) {
            layErase.setVisibility(View.GONE);
            layBrush.startAnimation(animclear);
            lanCamera_int++;

        } else if (lanCamera_int == 6) {
            layBrush.setVisibility(View.GONE);

            lanCamera_int = 0;
            anim_count = 0;

        }

    }

    @Override
    public void onAnimationRepeat(Animation animation) {
        // TODO Auto-generated method stub

    }

    @Override
    public void onAnimationStart(Animation animation) {
    }

    @Override
    public void colorSelected(Integer color) {
    }

    @Override
    public void onBackPressed() {
        if (!TextRecognizationUtils.detectedText.trim().equalsIgnoreCase("")) {
            Toast.makeText(this, "please select a value to go back", Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(this, "please press exit to go back", Toast.LENGTH_SHORT).show();
        }

       /* Bundle b = new Bundle();
        b.putString("result", "error");
        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_CANCELED, intent);
        super.onBackPressed();
        finish();*/
    }

    void save_bitmap() {
        ComputerVisionDetection.writeLogToFile("save_bitmap celled", "save_bitmap");

        Bitmap b_n = b.getB();

        try {

            if (camera_new.isCropMode) {
                b_n = Bitmap.createScaledBitmap(b_n, originalBitmap.getWidth(), originalBitmap.getHeight(), true);
            }

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
            String lat_str = null;
            String long_str = null;
            String username = null;


//            Log.d("##CROP_WIDTH", width);
//            Log.d("##CROP_HEIGHT", height);
//
//            Log.d("##CROP_WIDTH_B", String.valueOf(b_n.getWidth()));
//            Log.d("##CROP_HEIGHT_B", String.valueOf(b_n.getHeight()));

            if (camera_new.isCropMode) {
                b_n = Bitmap.createScaledBitmap(b_n, b_n.getWidth(), b_n.getHeight(), true);
            } else {
                b_n = Bitmap.createScaledBitmap(b_n, Integer.parseInt(width),
                        Integer.parseInt(height), true);
            }


            if (b_write.equals("true")) {
                int paddingTop = 0;
                PackageManager manager = getPackageManager();
                boolean hasAccelerometer = manager.hasSystemFeature(PackageManager.FEATURE_SENSOR_ACCELEROMETER);
                boolean hasCompass = manager.hasSystemFeature(PackageManager.FEATURE_SENSOR_COMPASS);
                /**
                 * if supported compass and accelerometer to change padding
                 * @param paddingTop
                 */
                if (hasAccelerometer && hasCompass) {
                    paddingTop = 170;
                } else {
                    paddingTop = 150;
                }

                if (camera_new.isCropMode) {
                    b_n = addPaddingTopForBitmap(b_n, 40);
                } else {
                    if(!info.equalsIgnoreCase(""))
                    {
                        JSONArray mJsonArray = new JSONArray(info);
                        int lenghtsize = mJsonArray.length() * 30;
                        paddingTop = paddingTop + lenghtsize + 25;
                    }
                    b_n = addPaddingTopForBitmap(b_n, paddingTop);
                }


                database = sqlitewraper.getDatabase();

                Cursor c3 = database.rawQuery(
                        "SELECT username,u_c,appid FROM Login_Master", null);
                c3.moveToLast();
                username = c3.getString(0);
                c3.close();

                Cursor c = database
                        .rawQuery(
                                "SELECT lat,lon,address, c_accuracy,date  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                                null);
                c.moveToFirst();

                if (c.getCount() > 0) {

                    String lat = pref.getString("lat", "k2");

                    String lon = pref.getString("lon", "k2");

                    String lat_n = c.getString(0);
                    String lon_n = c.getString(1);
                    if (lat_n == null) {

                        lat_str = "Lat: " + lat;

                        long_str = "Long: " + lon;

                    } else {

                        //
                        lat_str = "Lat: " + lat_n;

                        long_str = "Long: " + lon_n;
                    }
                    c.close();
                } else {
                    c.close();

                    getLastKnownLocation();

                    String lat = pref.getString("lat", String.valueOf(deviceLat));

                    String lon = pref.getString("lon", String.valueOf(deviceLng));

                    double lat_n = BigDecimal.valueOf(Double.parseDouble(lat))
                            .setScale(5, BigDecimal.ROUND_HALF_UP)
                            .doubleValue();
                    double lon_n = BigDecimal.valueOf(Double.parseDouble(lon))
                            .setScale(5, BigDecimal.ROUND_UP).doubleValue();

                    lat_str = "Lat: " + lat_n;

                    long_str = "Long: " + lon_n;

                }

                Bitmap dest = Bitmap.createBitmap(b_n.getWidth(),
                        b_n.getHeight(), Bitmap.Config.ARGB_8888);

            }

            // ---------------------maulik----------------------------

            @SuppressLint("SimpleDateFormat") SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            String dateTime = sdf.format(Calendar.getInstance().getTime());
            if (b_write.equals("true")) {
                PackageManager manager = getPackageManager();
                boolean hasAccelerometer = manager.hasSystemFeature(PackageManager.FEATURE_SENSOR_ACCELEROMETER);
                boolean hasCompass = manager.hasSystemFeature(PackageManager.FEATURE_SENSOR_COMPASS);

                MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
                int width1 = prefs.getInt("max_width", 0);
                int height2 = prefs.getInt("max_height", 0);


                if (picdevicelat.equals("0.0") && picdevicelng.equals("0.0")) {
                    picdevicelat = lat_str;
                    picdevicelng = long_str;
                } else {
                    picdevicelat = "Lat: " + picdevicelat;
                    picdevicelng = "Long: " + picdevicelng;
                }

                int textsize = 15;
                float textsize1 = 20f;
                float textsize2 = 15f;
                float textsize3 = 50f;
                float textsize4 = 85f;
                float textsize5 = 120f;
                float textsize6 = 90f;
                float textsize7 = 1200f;
                if (width1 != 0) {

                    if (width1 > 1080) {
                        textsize = 40;
                        textsize1 = 40f;
                        textsize2 = 15f;
                        textsize3 = 55f;
                        textsize4 = 95f;
                        textsize5 = 120f;
                        textsize6 = 103f;
                        textsize7 = 1200f;
                    }
                }


                if (camera_new.isCropMode) {
                    textsize = 12;
                }

                Canvas cs = new Canvas(b_n);
                Paint tPaint = new Paint();
                Paint tPaint1 = new Paint();
                tPaint.setTextSize(textsize);
                tPaint.setColor(Color.BLACK);
                tPaint1.setColor(Color.WHITE);
                tPaint1.setAlpha(80);
                float height1 = tPaint.measureText("yY");
                tPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
                tPaint.setStyle(Style.FILL_AND_STROKE);
                tPaint.setAntiAlias(true);
                tPaint.setStrokeWidth(0.5f);
                tPaint.setTextScaleX(1.2f);

                String picDeviceLatLong = picdevicelat + " - " + picdevicelng;
                String SensoCheck = "MF:" + MFtext + "," + SMText;

                if (camera_new.isCropMode) {

                    cs.drawText(dateTime, 10, height1 + 5, tPaint);
                    cs.drawText(picDeviceLatLong, 10, height1 + 15, tPaint);
//              cs.drawText(picdevicelng, textsize1, height1 + textsize4, tPaint);
                    cs.drawText("Username: " + username, 10, height1 + 25, tPaint);

                    /**
                     * if supported @hasAccelerometer and  @hascompass to draw text
                     */
                    if (hasAccelerometer && hasCompass) {
                        cs.drawText(SensoCheck, 10, height1 + 35, tPaint);
                    }
                } else {

                    cs.drawText(dateTime, textsize1, height1 + textsize2, tPaint);
                    cs.drawText(picDeviceLatLong, textsize1, height1 + textsize3, tPaint);
                    cs.drawText("Username: " + username, textsize1, height1 + textsize4, tPaint);
                    // info array set
                    if(!info.equalsIgnoreCase(""))
                    {

                        try {
                            JSONArray mJsonArray = new JSONArray(info);
                            String[] strArr = new String[mJsonArray.length()];

                            LinearLayout linearLayout = new LinearLayout(this);
                            linearLayout.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                                    ViewGroup.LayoutParams.WRAP_CONTENT));
                            linearLayout.setOrientation(LinearLayout.VERTICAL);
                            TextView textView1 = null;
                            for (int i = 0; i < mJsonArray.length(); i++) {
                                textView1 = new TextView(this);
                                strArr[i] = mJsonArray.getString(i);
                                textView1.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                                        ViewGroup.LayoutParams.WRAP_CONTENT));
                                textView1.setText(strArr[i]);
                                textsize6 = textsize6 + 35;
                                textView1.setTextSize(12);
                                cs.drawText(textView1.getText().toString(), textsize1, height1 + textsize6, tPaint);
                                linearLayout.addView(textView1);
                            }
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                    /**
                     * if supported @hasAccelerometer and  hascompass to draw text
                     */
                    if (hasAccelerometer && hasCompass) {
                        cs.drawText(SensoCheck, textsize7, height1 + textsize2, tPaint);
                    }
                }
            }

            FileOutputStream out = new FileOutputStream(file.getAbsolutePath());

            b_n = resize(b_n, serverWidth, serverHeight);

            b_n.compress(Bitmap.CompressFormat.JPEG, Integer.valueOf(quality), out);


            out.flush();
            out.close();

            data d = new data();
            int ret = d.getRet();
            Bundle b = new Bundle();

            String path = file.getAbsolutePath();
            File filelenght = new File(path);
            long lengthoffile = filelenght.length();
            lengthoffile = lengthoffile / 1024;

            int filesize = Integer.parseInt(max_file_size) * 1000;

            if (lengthoffile < filesize) {
                b.putString("status", file.getAbsolutePath());
                b.putInt("ret", ret);
                Intent intent = new Intent();
                intent.putExtras(b);
                ComputerVisionDetection.writeLogToFile(intent + " " + TextRecognizationUtils.finalTextString, "save_bitmap");
                if (getParent() == null) {

                    setResult(RESULT_OK, intent);
                } else {
                    getParent().setResult(Activity.RESULT_OK, intent);
                }

                pref.putString("photo_path", file.getAbsolutePath()); // Saving
                // string

                pref.commit();
                finish();
            }
            else {
                new Handler(Looper.getMainLooper()).post(new Runnable() {
                    @Override
                    public void run() {
                         Toast.makeText(context, "File size is too big ! \n File size must be less than "+max_file_size+"MB!", Toast.LENGTH_LONG).show();
                    }
                });

            }





        } catch (Exception e) {
            ComputerVisionDetection.writeLogToFile(e.toString() + TextRecognizationUtils.finalTextString, "save_bitmap");
            writeToFile(e.toString(), "");
        }

    }


    private static Bitmap resize(Bitmap image, int maxWidth, int maxHeight) {
        if (maxHeight > 0 && maxWidth > 0) {
            int width = image.getWidth();
            int height = image.getHeight();

            float ratioBitmap = (float) height / (float) width;
            float ratioMax = (float) maxHeight / (float) maxWidth;

            int finalWidth = maxWidth;
            int finalHeight = maxHeight;
            if (ratioMax > ratioBitmap) {
                finalWidth = (int) ((float) maxHeight * ratioBitmap);
            } else {
                finalHeight = (int) ((float) maxWidth / ratioBitmap);
            }

            if (camera_new.isCropMode) {
                image = Bitmap.createScaledBitmap(image, image.getWidth(), image.getHeight(), true);
            } else {
                image = Bitmap.createScaledBitmap(image, finalWidth, finalHeight, true);
            }
        }
        return image;
    }

    private void writeToFile(String stacktrace, String filename) {
        try {
            File imagesFolder = new File(
                    Environment.getExternalStorageDirectory(),
                    "Error_Easy_Form");
            imagesFolder.mkdirs();
            filename = "Easy_" + System.currentTimeMillis() + ".txt";
            BufferedWriter bos = new BufferedWriter(new FileWriter(
                    imagesFolder.getAbsolutePath() + "/" + filename));
            bos.write(stacktrace);
            bos.flush();
            bos.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
    }

    void bitmap() {

        generateNoteOnSD("photo3.txt", path_mm + "\n" + "bitmap");
        try {
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inInputShareable = true;

            options.inMutable = true;
            options.inSampleSize = 8;

            pref = sqlitewraper.getSecureShared("MyPref");
            String mCaptured = pref.getString("outputuri", "k2");

            path_mm += "\n bitmap:" + mCaptured;

            File pictureFile = new File(mCaptured);

            if (drawflag.equals("1")) {
                getresult(pictureFile);
                Bundle b = new Bundle();

                b.putString("status", mCaptured);
                Intent intent = new Intent();
                intent.putExtras(b);

                pref.putString("photo_path", mCaptured); // Saving string

                pref.commit();

                setResult(RESULT_OK, intent);


                finish();
            } else {


                int rotation = getRotation(sqlitewraper.context,
                        Uri.fromFile(pictureFile));

                FileInputStream fis = new FileInputStream(pictureFile);
                Bitmap bitmap = BitmapFactory.decodeFileDescriptor(fis.getFD(),
                        null, options);

                if (!bitmap.isMutable()) {
                    bitmap = convertToMutable(sqlitewraper.context, bitmap);
                }
                try {
                    bitmap = imageOreintationValidator(bitmap, mCaptured);
                } catch (Exception e) {
                    e.printStackTrace();
                }

                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
                String dateTime = sdf.format(Calendar.getInstance().getTime()); // reading

                if (bitmap != null) {
                    bitmap = Bitmap.createScaledBitmap(bitmap, Integer.valueOf(width),
                            Integer.valueOf(height), true);
                }

                String lat_str = null;
                String long_str = null;
                String username = null;
                if (b_write.equals("true")) {
                    database = sqlitewraper.getDatabase();

                    Cursor c3 = database.rawQuery(
                            "SELECT username,u_c,appid FROM Login_Master", null);
                    c3.moveToLast();
                    username = c3.getString(0);
                    c3.close();
                    Cursor c = database
                            .rawQuery(
                                    "SELECT lat,lon,address, c_accuracy,date  FROM  track_master WHERE   _id = (SELECT MAX(_id) FROM track_master);",
                                    null);
                    c.moveToFirst();

                    if (c.getCount() > 0) {

                        String lat = pref.getString("lat", "k2");

                        String lon = pref.getString("lon", "k2");

                        String lat_n = c.getString(0);
                        String lon_n = c.getString(1);
                        if (lat_n == null) {

                            lat_str = "Lat: " + lat;

                            long_str = "Long: " + lon;

                        } else {

                            //
                            lat_str = "Lat: " + lat_n;

                            long_str = "Long: " + lon_n;
                        }
                    } else {

                        getLastKnownLocation();

                        String lat = pref.getString("lat", String.valueOf(deviceLat));

                        String lon = pref.getString("lon", String.valueOf(deviceLng));

                        double lat_n = BigDecimal.valueOf(Double.parseDouble(lat))
                                .setScale(5, BigDecimal.ROUND_HALF_UP)
                                .doubleValue();
                        double lon_n = BigDecimal.valueOf(Double.parseDouble(lon))
                                .setScale(5, BigDecimal.ROUND_UP).doubleValue();

                        lat_str = "Lat: " + lat_n;

                        long_str = "Long: " + lon_n;

                    }

                    Bitmap dest = Bitmap.createBitmap(bitmap.getWidth(),
                            bitmap.getHeight(), Bitmap.Config.ARGB_8888);

                }

                try {
                    int angle = 0;

                    if ((rotation > 1) && rot == 0) {
                        bitmap = rotateImage(bitmap, 90);
                        angle++;

                    }
                    ExifInterface ei = new ExifInterface(mCaptured);
                    rotation = ei.getAttributeInt(ExifInterface.TAG_ORIENTATION,
                            ExifInterface.ORIENTATION_UNDEFINED);
                    if ((rotation > 1) && angle == 0 && rot == 0) {
                        bitmap = rotateImage(bitmap, 90);

                    }
                    if (b_write.equals("true")) {

                        MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
                        int width1 = prefs.getInt("max_width", 0);
                        int height2 = prefs.getInt("max_height", 0);

                        if (picdevicelat.equals("0.0") && picdevicelng.equals("0.0")) {
                            picdevicelat = lat_str;
                            picdevicelng = long_str;
                        } else {
                            picdevicelat = picdevicelat;
                            picdevicelng = picdevicelng;
                        }


                        int textsize = 15;
                        float textsize1 = 20f;
                        float textsize2 = 15f;
                        float textsize3 = 50f;
                        float textsize4 = 85f;
                        float textsize5 = 115f;
                        if (width1 != 0) {

                            if (width1 > 1080) {
                                textsize = 40;
                                textsize1 = 40f;
                                textsize2 = 15f;
                                textsize3 = 50f;
                                textsize4 = 85f;
                                textsize5 = 115f;
                            }
                        }

                        Canvas cs = new Canvas(bitmap);
                        Paint tPaint = new Paint();
                        Paint tPaint1 = new Paint();
                        tPaint.setTextSize(textsize);
                        tPaint.setColor(Color.BLACK);
                        tPaint1.setColor(Color.WHITE);
                        tPaint1.setAlpha(80);
                        tPaint.setAntiAlias(true);
                        tPaint.setStyle(Style.FILL);
                        float height1 = tPaint.measureText("yY");
                        tPaint.setTypeface(Typeface.create("Arial", Typeface.BOLD));
                        cs.drawRect(0, 0, 700, 175, tPaint1);
                        cs.drawText(dateTime, textsize1, height1 + textsize2, tPaint);
                        cs.drawText(picdevicelat, textsize1, height1 + textsize3, tPaint);
                        cs.drawText(picdevicelng, textsize1, height1 + textsize4, tPaint);
                        cs.drawText("username :  " + username, textsize1, height1 + textsize5, tPaint);
                    }


                    if (bitmap != null) {
                        bitmap.compress(Bitmap.CompressFormat.JPEG, Integer
                                .parseInt(quality), new FileOutputStream(new File(
                                mCaptured)));
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }

                if (bitmap != null) {
                    bitmap.recycle();
                }

                Bundle b = new Bundle();
                b.putString("status", mCaptured);
                Intent intent = new Intent();
                intent.putExtras(b);
                setResult(RESULT_OK, intent);

                pref.putString("photo_path", mCaptured); // Saving string

                pref.commit();

                path_mm += "\n Final_path:" + mCaptured;

                generateNoteOnSD("photo.txt", path_mm);

                finish();
            }
        } catch (Exception e) {
            e.printStackTrace();
            generateNoteOnSD("photo4.txt",
                    path_mm + "\n" + "bitmap" + e.toString());
            Bundle b = new Bundle();
            b.putString("result", e.toString());
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);
            finish();

        }
    }

    void getresult(File path) {
        Intent i = new Intent(sqlitewraper.context, easy_draw_new.class);
        i.putExtra("File", path);
        i.putExtra("b_write", b_write);
        i.putExtra("width", width);
        i.putExtra("quality", quality);
        i.putExtra("height", height);
        i.putExtra("flagdraw", "1");
        i.putExtra("drawflag", "1");
        startActivityForResult(i, 111);

    }

    @Override
    public void onLocationChanged(Location location) {
        deviceLat = location.getLatitude();
        deviceLng = location.getLongitude();
    }

    @Override
    public void onSubmitButtonClick() {
        ComputerVisionDetection.writeLogToFile("onSubmitButtonClick Called" + TextRecognizationUtils.finalTextString, "showEnterManualAlertDialog");

        String finalStringAzure = TextRecognizationUtils.finalTextString;

        if (finalStringAzure.equalsIgnoreCase("")) {
            Toast.makeText(easy_draw_new.this, "Please select at least one value or enter manual value.", Toast.LENGTH_LONG).show();
        } else {
            Toast.makeText(easy_draw_new.this, "Selected value is: " + finalStringAzure, Toast.LENGTH_LONG).show();
            TripMapUtils.setIsBypassActivity(true);
            GetHashesFromServerTask getHashesFromServerTask = new GetHashesFromServerTask();
            getHashesFromServerTask.execute();
        }

    }

    @SuppressLint("StaticFieldLeak")
    private class GetHashesFromServerTask extends AsyncTask<String, String, String> {
        ShowProgress progress = new ShowProgress();

        @Override
        protected void onPreExecute() {
            // Activity 1 GUI stuff
            try {
                progress.showProgressDialog(easy_draw_new.this, "Please Wait...");
            } catch (Exception e) {
                e.printStackTrace();
            }

        }

        @Override
        protected String doInBackground(String... postParams) {
            ComputerVisionDetection.writeLogToFile("doInBackground celled", "doInBackground");
            save_bitmap();
            return "";
        }


        @Override
        protected void onPostExecute(String status) {
            super.onPostExecute(status);
            finish();
            String dir = Environment
                    .getExternalStorageDirectory()
                    + File.separator + "myDirectory";
            File folder = new File(dir);
            progress.hideProgressDialog(easy_draw_new.this);

        }
    }

    private void getLastKnownLocation() {
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        Location lastLocation = LocationServices.FusedLocationApi.getLastLocation(googleApiClient);
        if (lastLocation != null) {
            deviceLat = lastLocation.getLatitude();
            deviceLng = lastLocation.getLongitude();
        }
    }

    private void inittfLIteModel() {

        int cropSize = 512;

        try {
            ComputerVisionDetection.detector =
                    TFLiteObjectDetectionAPIModel.create(
                            getAssets(),
                            TF_OD_API_MODEL_FILE,
                            TF_OD_API_LABELS_FILE,
                            TF_OD_API_INPUT_SIZE,
                            TF_OD_API_IS_QUANTIZED);
            cropSize = TF_OD_API_INPUT_SIZE;
        } catch (final IOException e) {
            e.printStackTrace();
            Log.e("##CATCH", "Exception initializing classifier!");
            Toast toast =
                    Toast.makeText(
                            sqlitewraper.context, "Classifier could not be initialized", Toast.LENGTH_SHORT);
            toast.show();
        }
    }

    String uniqueCode;

    private final class LongOperation extends AsyncTask<Bitmap, Void, String> {

        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            azureTextView.setText("Please wait...");
        }

        @Override
        protected String doInBackground(Bitmap... bitmaps) {

            String secondUrl = "";

            try {
                secondUrl = computerVisionDetection.computervisionReqEasyform(bitmaps[0], uniqueCode);
            } catch (Exception e) {
                ComputerVisionDetection.writeLogToFile(e.toString(), "computervisionReqEasyform Call");
                e.printStackTrace();
            }
            return secondUrl;
        }

        @Override
        protected void onPostExecute(final String responseString) {
            final Handler handler = new Handler(Looper.getMainLooper());
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        String status;
                        String secondUrl, message = null;
                        try {
                            JSONArray jsonArray = new JSONArray(responseString);
                            JSONObject jsonObject = jsonArray.getJSONObject(0);
                            status = jsonObject.getString("status");
                            message = jsonObject.getString("message");
                            if (jsonObject.has("data")) {
                                secondUrl = jsonObject.getString("data");
                            } else {
                                secondUrl = null;
                            }
                        } catch (JSONException e) {
                            status = "10";
                            secondUrl = null;
                            e.printStackTrace();
                        }
                        if (status.equalsIgnoreCase("1")) {
                            if (secondUrl != null) {
                                tvOldImage.setVisibility(View.GONE);
                                Log.d("secondUrl", secondUrl + " " + URLUtil.isHttpsUrl(secondUrl));
                                if (URLUtil.isHttpsUrl(secondUrl)) {
                                    String textString = computerVisionDetection.getImageTextEasyform(secondUrl);
                                    Log.d("##RES_TEXT_STRING_1", textString);
                                    while (textString.equalsIgnoreCase("running")) {
                                        Thread.sleep(1000);
                                        textString = computerVisionDetection.getImageTextEasyform(secondUrl);
                                        Log.d("##RES_TEXT_STRING_1", textString);
                                    }
                                    Log.d("##RES_TEXT_STRING_2", textString);
                                    updateValuesToDatabase(textString, "text", uniqueCode);
                                    textString = getStringFromJson(textString);
                                    if (!textString.equalsIgnoreCase("")) {
                                        setSpanabbleText(textString);
                                        //btnExit.setVisibility(View.GONE);
                                        btnRefresh.setVisibility(View.GONE);
                                    } else {
                                        azureTextView.setText("OCR is Unable to detect reading, Please enter manually.");
                                        TextRecognizationUtils.inputType = "manual";
                                        btnExit.setVisibility(View.VISIBLE);
                                        btnRefresh.setVisibility(View.GONE);
                                        // getDataFromDatabase();
                                        // btnEnterManual.setVisibility(View.VISIBLE);
                                    }
                                    normalString = textString;
                            /*for (int i = 0; i < computerVisionDetection.listOflines.size(); i++) {
                                 drawLineToCanvas(computerVisionDetection.listOflines.get(i));
                            }*/
                                } else {
                                    azureTextView.setText("OCR is Unable to detect reading, Please enter manually.");
                                    TextRecognizationUtils.inputType = "manual";
                                    btnExit.setVisibility(View.VISIBLE);
                                    btnRefresh.setVisibility(View.GONE);
                                }
                            }
                        } else if (status.equalsIgnoreCase("3")) {
                            tvOldImage.setVisibility(View.GONE);
                            azureTextView.setText(secondUrl);
                            btnExit.setVisibility(View.VISIBLE);
                            btnRefresh.setVisibility(View.GONE);
                        } else if (status.equalsIgnoreCase("4")) {
                            if (message != null) {
                                showAlertDialogAndExitApp(message);//logout_on_click_online
                            } else {
                                showAlertDialogAndExitApp("Authentication Failed!");
                            }
                        } else if (status.equalsIgnoreCase("9")) {
                            azureTextView.setText(secondUrl);
                            TextRecognizationUtils.inputType = "LimitReached";
                            btnExit.setVisibility(View.GONE);
                            btnRefresh.setVisibility(View.GONE);
                            deleteFromDatabase(uniqueCode);
                            showAlertDialogWithMessage(secondUrl);
                            // getDataFromDatabase(false, false);
                        } else if (status.equalsIgnoreCase("10")) {
                            tvOldImage.setVisibility(View.GONE);
                            azureTextView.setText("Network Error!. Please Refresh");
                            btnRefresh.setVisibility(View.VISIBLE);
                            btnExit.setVisibility(View.GONE);
                        } else {
                            tvOldImage.setVisibility(View.GONE);
                            azureTextView.setText(secondUrl);
                            btnExit.setVisibility(View.VISIBLE);
                            btnRefresh.setVisibility(View.GONE);
                        }
                    } catch (Exception e) {
                        ComputerVisionDetection.writeLogToFile(e.toString(), "");
                        e.printStackTrace();
                    }
                }
            }, 3000);
        }
    }

    public void showAlertDialogAndExitApp(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        Bundle b = new Bundle();
        Intent intent1 = new Intent();
        b.putBoolean("logout", true);
        intent1.putExtras(b);
        setResult(RESULT_CANCELED, intent1);
        finish();
    }

    private void drawLineToCanvas(JSONArray linesBoundingBoxArray) {

        try {

            Canvas canvas = new Canvas(lastBitmap);

            Paint paint = new Paint();
            paint.setAlpha(0xA0); // the transparency
            paint.setColor(Color.WHITE); // color is white
            paint.setStyle(Style.STROKE); // stroke or fill or ...
            paint.setStrokeWidth(3);
            paint.setTextSize(40);

            int leftX = linesBoundingBoxArray.getInt(0);
            int leftY = linesBoundingBoxArray.getInt(1);
            int rightX = linesBoundingBoxArray.getInt(2);
            int rightY = linesBoundingBoxArray.getInt(3);
            int topX = linesBoundingBoxArray.getInt(4);
            int topY = linesBoundingBoxArray.getInt(5);
            int bottomX = linesBoundingBoxArray.getInt(6);
            int bottomY = linesBoundingBoxArray.getInt(7);


            canvas.drawLine(leftX, leftY, rightX, rightY, paint);
            canvas.drawLine(rightX, rightY, topX, topY, paint);
            canvas.drawLine(topX, topY, bottomX, bottomY, paint);
            canvas.drawLine(bottomX, bottomY, leftX, leftY, paint);

            Log.d("##DRAW_LINE", String.valueOf(leftX));

//        for(int i = 0; i < linesBoundingBoxArray.length(); i++) {
//
//
//
//        }
        } catch (Exception e) {
            e.printStackTrace();
            Log.d("##DRAW_LINE", e.getMessage());
        }
    }

    /**
     * @param textString send string to add spaces before and after add
     * @return add spaces text
     * @apiNote it will add spaces before and after the words Or Char if the is before and after is numbers
     */
    String addSpacesInChar(String textString) {

        StringBuilder sb = new StringBuilder();


        for (int i = 0; i < textString.length(); i++) {
            char letter = textString.charAt(i);
            if (i != 0 && Character.isAlphabetic(letter)) {
                boolean isNumberFast;
                boolean isNumberLast;
                try {
                    isNumberFast = Character.isDigit(textString.charAt(i - 1));
                } catch (Exception e) {
                    isNumberFast = false;
                }
                try {
                    isNumberLast = Character.isDigit(textString.charAt(i + 1));
                } catch (Exception e) {
                    isNumberLast = false;
                }

                if (isNumberFast)
                    sb.append(' ');
                sb.append(letter);
                if (isNumberLast)
                    sb.append(' ');
            } else {
                sb.append(letter);
            }
        }
        return sb.toString();
    }

    String getNumberFromString(String textString) {
        try {
            /*final String re = "\\b\\d+(?:\\h\\d+)+\\b";*/
            //final String re = "\\d+(?:\\h+\\d+)+";
            final String re = "\\b\\d+(?:\\h\\d+)+\\b";

            StringBuilder sb = new StringBuilder();

            Matcher matcher = Pattern.compile(re).matcher(textString);
            while (matcher.find()) {

                Log.d("##NUMBER_MATCHGROUP", matcher.group());

                String newString = matcher.group();
                newString = newString.replaceAll("\\s", "");
                sb.append(" ").append(newString);
                Log.d("##NUMBER_MATCHSB", sb.toString());
            }
            return sb.toString();
        } catch (Exception e) {
            ComputerVisionDetection.writeLogToFile(e.toString(), "getNumberFromString");
            return "";
        }

    }


    private void saveValuesToDatabase(String detectedText, String detectionType, String uniqueCode) {

        SQLiteDatabase database = sqlitewraper.getDatabase();
        ContentValues c = new ContentValues();
        if (detectedText.isEmpty()) {
            c.put("detectedtext", detectedText);
            c.put("hasResponse", 0);
        } else {
            c.put("detectedtext", detectedText);
            c.put("hasResponse", 1);
        }
        c.put("sid", AzureUtils.serverTaskId);
        c.put("checksheetid", AzureUtils.checksheetID);
        c.put("queid", AzureUtils.questionID);
        c.put("detectiontype", detectionType);
        this.detectionType = detectionType;
        c.put("imgpath", f_image.getAbsolutePath());
        c.put("orpath", PhotoConstants.originalPhoto);
        c.put("Unique_id", uniqueCode);
        ComputerVisionDetection.writeLogToFile(c.toString(), "saveValuesToDatabase");
        if (!isFoundDataFromDatabase(f_image.getAbsolutePath())) {
            long temp = database.insert("meterreading", null, c);
            Log.d("##DATABSE_INSERT", String.valueOf(temp));
        }
    }

    private void updateValuesToDatabase(String detectedText, String detectionType, String uniqueCode) {

        SQLiteDatabase database = sqlitewraper.getDatabase();
        ContentValues c = new ContentValues();
        if (detectedText.isEmpty()) {
            c.put("detectedtext", detectedText);
            c.put("hasResponse", 0);
        } else {
            c.put("detectedtext", detectedText);
            c.put("hasResponse", 1);
        }
        c.put("sid", AzureUtils.serverTaskId);
        c.put("checksheetid", AzureUtils.checksheetID);
        c.put("queid", AzureUtils.questionID);
        c.put("detectiontype", detectionType);
        this.detectionType = detectionType;
        c.put("imgpath", f_image.getAbsolutePath());
        c.put("orpath", PhotoConstants.originalPhoto);
        c.put("Unique_id", uniqueCode);
        ComputerVisionDetection.writeLogToFile(c.toString(), "updateValuesToDatabase");
        long temp = database.update("meterreading", c, "Unique_id=?", new String[]{uniqueCode});
        Log.d("##DATABSE_INSERT", String.valueOf(temp));
    }

    public JSONArray linesBoundingBoxArray;
    public ArrayList<JSONArray> listOflines;

    private String getStringFromJson(String responseString) throws JSONException {

        String finalString = "";
        JSONObject mainObject = new JSONObject(responseString);
        String anaLyzedString = mainObject.getString("analyzeResult");
        JSONObject analyzeResultObject = new JSONObject(anaLyzedString);

        JSONArray analyzeResultArray = analyzeResultObject.getJSONArray("readResults");

        for (int i = 0; i < analyzeResultArray.length(); i++) {

            JSONObject readResultsObject = analyzeResultArray.getJSONObject(i);
            JSONArray linesArray = readResultsObject.getJSONArray("lines");

            listOflines = new ArrayList<>();


            for (int j = 0; j < linesArray.length(); j++) {
                JSONObject linesObject = linesArray.getJSONObject(j);
                JSONArray wordsArray = linesObject.getJSONArray("words");


                for (int k = 0; k < wordsArray.length(); k++) {
                    JSONObject wordsObject = wordsArray.getJSONObject(k);
                    String textKey = wordsObject.getString("text");
                    finalString = finalString + " " + textKey;

                    linesBoundingBoxArray = wordsObject.getJSONArray("boundingBox");
                    listOflines.add(linesBoundingBoxArray);
                }
                finalString = finalString + "\n";

                //for Bounding box new code
                /*linesBoundingBoxArray = linesObject.getJSONArray("boundingBox");
                listOflines.add(linesBoundingBoxArray);*/

                // drawLineToCanvas(linesBoundingBoxArray);

            }
        }
        return finalString;
    }

    String detectionType;

    private void getDataFromDatabase(boolean setImage, boolean isRefresh) {

        try {

            Log.d("##DATA_DETECTED_TEXT", "DATA LIMIT");


            String sid = AzureUtils.serverTaskId;
            String queid = AzureUtils.questionID;
            String checkSheetID = AzureUtils.checksheetID;

            String selectQuery = "SELECT detectedtext,imgpath,detectiontype,orpath FROM meterreading where sid=" + sid + " AND checksheetid='" + checkSheetID + "' AND queid=" + queid + " ORDER BY id DESC LIMIT 1";
            ComputerVisionDetection.writeLogToFile(selectQuery, "getDataFromDatabase");
            SQLiteDatabase db = sqlitewraper.getDatabase();
            Cursor cursor = db.rawQuery(selectQuery, null);
            if (cursor.getCount() > 0) {
                cursor.moveToFirst();
                detectionType = cursor.getString(2);
                final String resopText = cursor.getString(0);
                final String detectedText;
                final String imgPath = cursor.getString(1);
                Bitmap icon = BitmapFactory.decodeFile(imgPath);
                Bitmap mutableBitmap = icon.copy(Bitmap.Config.ARGB_8888, true);
                String detectedText1;
                if (resopText != null && !resopText.equals("")) {
                    try {
                        if (detectionType.equals("seven")) {
                            detectedText1 = get7SegStringfromResponse(resopText, mutableBitmap);
                        } else {
                            detectedText1 = getStringFromJson(resopText);
                        }
                    } catch (Exception e) {
                        if (!resopText.equals("")) {
                            detectedText1 = resopText;
                        } else {
                            detectedText1 = "";
                        }
                        ComputerVisionDetection.writeLogToFile("error : " + e.toString(), "getDataFromDatabase");
                    }
                    if (detectedText1.equals("")) {
                        detectedText1 = "OCR is Unable to detect reading, Please enter manually.";
                        btnExit.setVisibility(View.VISIBLE);
                    }
                } else {
                    detectedText1 = "";
                }
                detectedText = detectedText1;

                final String originalPath = cursor.getString(3);
                cursor.close();
                if (setImage) {

                    PhotoConstants.originalPhoto = originalPath;

                    GetColor color2 = new GetColor();
                    color2.setColorValue(-54784);
                    DrawingView mDrawingView = new DrawingView(this, mutableBitmap);
                    b.setMutableBitmap(mutableBitmap);
                    b.setB(mutableBitmap);
                    lastBitmap = mutableBitmap;
                    imageView.setImageBitmap(lastBitmap);
                    alteredBitmap = Bitmap.createBitmap(lastBitmap.getWidth(), lastBitmap.getHeight(), lastBitmap.getConfig());
                    setSpanabbleText(detectedText);
                    if (isRefresh) {
                        azureTextView.setText("Please wait...");
                        try {
                            gatingImageToText(lastBitmap, detectionType);
                        } catch (IOException | JSONException e) {
                            ComputerVisionDetection.writeLogToFile("Exception: " + e.toString(), "gatingImageToText " + detectionType);
                            //e.printStackTrace();
                        }
                    }
                } else {
                    tvOldImage.setVisibility(View.GONE);
                    tvOldImage.setOnClickListener(v -> {
                        getAlertWithImage(imgPath, detectedText, originalPath);
                    });
                }
            }
        } catch (Exception e) {
            ComputerVisionDetection.writeLogToFile("error : " + e.toString(), "getDataFromDatabase");
            Log.d("##DATA_DETECTED_ERROR", e.getMessage());
        }
    }


    private boolean isFoundDataFromDatabase(String uniqueCode) {

        try {

            Log.d("##DATA_DETECTED_TEXT", "DATA LIMIT");


            String sid = AzureUtils.serverTaskId;
            String queid = AzureUtils.questionID;
            String checkSheetID = AzureUtils.checksheetID;

            String selectQuery = "SELECT id FROM meterreading where sid=" + sid + " AND checksheetid='" + checkSheetID + "' AND queid=" + queid + " AND imgpath='" + uniqueCode + "' ORDER BY id DESC LIMIT 1";
            ComputerVisionDetection.writeLogToFile(selectQuery, "getDataFromDatabase");
            SQLiteDatabase db = sqlitewraper.getDatabase();
            Cursor cursor = db.rawQuery(selectQuery, null);
            if (cursor.getCount() > 0) {
                cursor.moveToFirst();
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            ComputerVisionDetection.writeLogToFile("error : " + e.toString(), "getDataFromDatabase");
            Log.d("##DATA_DETECTED_ERROR", e.getMessage());
            return false;
        }
    }// 378d6ff5-0406-4d40-ac38-9b21eca477b9

    private void deleteFromDatabase(String uniqueCode) {
        String sid = AzureUtils.serverTaskId;
        String queid = AzureUtils.questionID;
        String checkSheetID = AzureUtils.checksheetID;

        String selectQuery = "SELECT id FROM meterreading where sid=" + sid + " AND checksheetid='" + checkSheetID + "' AND queid=" + queid + " AND hasResponse = 0 AND Unique_id='" + uniqueCode + "' ORDER BY id DESC LIMIT 1";
        ComputerVisionDetection.writeLogToFile(selectQuery, "deleteFromDatabase");
        SQLiteDatabase db = sqlitewraper.getDatabase();
        Cursor cursor = db.rawQuery(selectQuery, null);
        if (cursor.getCount() > 0) {
            cursor.moveToFirst();
            final String id = cursor.getString(0);
            cursor.close();
            long temp = db.delete("meterreading", "id=?", new String[]{id});
            ComputerVisionDetection.writeLogToFile(temp + "  ", "delete Result");
        } else {
            ComputerVisionDetection.writeLogToFile("NoData Found", "deleteFromDatabase");
        }
    }

    private void getAlertWithImage(String imgPath, String detectedText, String originalPath) {

        AlertDialog.Builder builder = new AlertDialog.Builder(easy_draw_new.this);
        builder.setCancelable(false);
        LayoutInflater inflater = easy_draw_new.this.getLayoutInflater();
        View dialogView = inflater.inflate(R.layout.alertdialogimageview, null);
        ImageView imageView2 = dialogView.findViewById(R.id.goProDialogImage);

        dialogView.<TextView>findViewById(R.id.previous_text).setText(detectedText);

        Bitmap icon = BitmapFactory.decodeFile(imgPath);
        imageView2.setImageBitmap(icon);

        builder.setView(dialogView)
                .setPositiveButton("SELECT", (dialog, which) -> {
                    PhotoConstants.originalPhoto = originalPath;
                    setSpanabbleText(detectedText);
                    Bitmap mutableBitmap = icon.copy(Bitmap.Config.ARGB_8888, true);
                    GetColor color2 = new GetColor();
                    color2.setColorValue(-54784);
                    //  DrawingView mDrawingView = new DrawingView(this, mutableBitmap);
                    b.setMutableBitmap(mutableBitmap);
                    b.setB(mutableBitmap);
                    lastBitmap = mutableBitmap;
                    imageView.setImageBitmap(lastBitmap);
                    tvOldImage.setVisibility(View.GONE);
                    btnRefresh.setVisibility(View.GONE);
                    //btnExit.setVisibility(View.GONE);
                    //lan.removeAllViews();
                    /*lan.removeAllViews();
                    lan.addView(imageTflite);*/
                    /*count++;
                    if (count > 0) {
                        lan.removeView(mydrawingView);
                        lan.addView(mDrawingView);
                    } else {
                        lan.addView(mDrawingView);
                    }*/

                })
                .setNegativeButton("CANCEL", (dialog, which) -> {
                    dialog.dismiss();
                }).create()
                /* .setNegativeButton("ENTER MANUAL", (dialog, which) -> {
                     TextRecognizationUtils.showEnterManualAlertDialog(easy_draw_new.this, false, null, selectedReadingView);
                 }).create()*/.show();

    }


    private void showAlertDialogWithMessage(String secondUrl) {
        AlertDialog.Builder alertBuilder = new AlertDialog.Builder(easy_draw_new.this);
        alertBuilder.setTitle("Limit Reached");
        alertBuilder.setMessage(secondUrl);
        alertBuilder.setCancelable(false);
        alertBuilder.setPositiveButton("Ok", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();
                if (!getDataFromDatabaseLastImage()) {
                    TextRecognizationUtils.detectedText = "0";
                    TextRecognizationUtils.finalTextString = "0";
                    GetHashesFromServerTask getHashesFromServerTask = new GetHashesFromServerTask();
                    getHashesFromServerTask.execute();
                }
            }
        });
        alertBuilder.show();
    }


    private boolean getDataFromDatabaseLastImage() {
        try {
            String sid = AzureUtils.serverTaskId;
            String queid = AzureUtils.questionID;
            String checkSheetID = AzureUtils.checksheetID;

            String selectQuery = "SELECT imgpath,Unique_id,hasResponse,orpath FROM meterreading where sid=" + sid + " AND checksheetid='" + checkSheetID + "' AND queid=" + queid + " ORDER BY id DESC LIMIT 1";

            ComputerVisionDetection.writeLogToFile(selectQuery, "Camera_new getDataFromDatabase");
            SQLiteDatabase db = sqlitewraper.getDatabase();
            Cursor cursor = db.rawQuery(selectQuery, null);
            if (cursor.getCount() > 0) {
                cursor.moveToFirst();
                //  final String detectedText = cursor.getString(0);
                final String imgPath = cursor.getString(0);
                final String Unique_id = cursor.getString(1);
                final int hasResponse = cursor.getInt(2);
                final String orpath = cursor.getString(3);
               /* final String detectionType = cursor.getString(2);
                final String originalPath = cursor.getString(3);*/
                cursor.close();
                MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
                int width1 = prefs.getInt("max_width", 0);
                int height1 = prefs.getInt("max_height", 0);

                String max_width = String.valueOf(width1);
                String max_height = String.valueOf(height1);
                ComputerVisionDetection.writeLogToFile("selectQuery Data : imgPath :" + imgPath
                        + " Unique_id :" + Unique_id + " hasResponse :" + hasResponse + " orpath :" + orpath, "Camera_new getDataFromDatabase");
                File originalImage = new File(orpath);
                File cropImage = new File(imgPath);
                if (cropImage.exists() && originalImage.exists()) {
                    return getLastKnownLocation(b_write, width, height, quality, imgPath, max_width, max_height, Unique_id, hasResponse, orpath);
                } else {
                    deleteFromDatabase(Unique_id, originalImage.getAbsolutePath(), cropImage.getAbsolutePath());
                    return getDataFromDatabaseLastImage();
                }
            } else {
                return false;
            }
        } catch (Exception e) {
            ComputerVisionDetection.writeLogToFile("error : " + e.toString(), "Camera_new getDataFromDatabase");
            Log.d("##DATA_DETECTED_ERROR", e.getMessage());
            return false;
        }
    }

    private void deleteFromDatabase(String uniqueCode, String originalImage, String cropImage) {
        String sid = AzureUtils.serverTaskId;
        String queid = AzureUtils.questionID;
        String checkSheetID = AzureUtils.checksheetID;

        String selectQuery = "SELECT id FROM meterreading where sid=" + sid + " AND checksheetid='" + checkSheetID + "' AND queid=" + queid + " AND Unique_id='" + uniqueCode + "' AND orpath='" + originalImage + "' AND imgpath='" + cropImage + "' ORDER BY id DESC LIMIT 1";
        ComputerVisionDetection.writeLogToFile(selectQuery, "deleteFromDatabase");
        SQLiteDatabase db = sqlitewraper.getDatabase();
        Cursor cursor = db.rawQuery(selectQuery, null);
        if (cursor.getCount() > 0) {
            cursor.moveToFirst();
            final String id = cursor.getString(0);
            cursor.close();
            long temp = db.delete("meterreading", "id=?", new String[]{id});
            ComputerVisionDetection.writeLogToFile(temp + "  ", "delete Result");
        } else {
            ComputerVisionDetection.writeLogToFile("NoData Found", "deleteFromDatabase");
        }
    }

    private Boolean getLastKnownLocation(String b_write, String width, String height, String quality, String imgPath, String max_width, String max_height, String unique_id, int hasResponse, String orpath) {
        GoogleApiClient googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(sqlitewraper.context, "Allow All Permissions", Toast.LENGTH_SHORT).show();
            return false;
        }
        Location lastLocation = LocationServices.FusedLocationApi.getLastLocation(googleApiClient);
        if (lastLocation != null) {

            double deviceLat = lastLocation.getLatitude();
            double deviceLng = lastLocation.getLongitude();
            PhotoConstants.originalPhoto = orpath;
            Intent i = new Intent(sqlitewraper.context, easy_draw_new.class);
            i.putExtra("File", new File(imgPath));
            i.putExtra("b_write", b_write);
            i.putExtra("width", max_width);
            i.putExtra("quality", quality);
            i.putExtra("height", max_height);
            i.putExtra("picclicklat", String.valueOf(deviceLat));
            i.putExtra("picclicklng", String.valueOf(deviceLng));
            i.putExtra("flagdraw", "0");
            i.putExtra("drawflag", "0");
            i.putExtra("cameraview", -2);
            i.putExtra("serverwidth", width);
            i.putExtra("serverheight", height);
            i.putExtra("uniqueId", unique_id);
            i.putExtra("hasResponse", hasResponse);
            i.putExtra("canInsert", hasResponse);
            if (hasResponse == 1) {
                i.putExtra("ShowOldImage", 1);
            } else {
                i.putExtra("ShowOldImage", 2);
            }
            startActivityForResult(i, 4812);
            return true;
        } else {
            Toast.makeText(sqlitewraper.context, "LatLong not found", Toast.LENGTH_SHORT).show();
            return false;
        }

    }


}