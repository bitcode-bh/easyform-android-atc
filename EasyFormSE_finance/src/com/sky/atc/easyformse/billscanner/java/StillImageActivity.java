package com.sky.atc.easyformse.billscanner.java;

import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.Point;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.SpannableString;
import android.text.Spanned;
import android.util.Log;
import android.util.Pair;
import android.view.Display;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.view.ViewTreeObserver.OnGlobalLayoutListener;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.core.widget.NestedScrollView;


import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.billscanner.GraphicOverlay;
import com.sky.atc.easyformse.billscanner.MySuperAppApplication;
import com.sky.atc.easyformse.billscanner.VisionImageProcessor;
import com.sky.atc.easyformse.billscanner.java.textdetector.TextGraphic;
import com.sky.atc.easyformse.billscanner.java.textdetector.TextRecognitionProcessor;
import com.sky.atc.easyformse.billscanner.preference.ScannerConstants;
import com.sky.atc.easyformse.billscanner.preference.TextInterface;
import com.google.mlkit.nl.entityextraction.Entity;
import com.google.mlkit.nl.entityextraction.EntityAnnotation;
import com.google.mlkit.nl.entityextraction.EntityExtraction;
import com.google.mlkit.nl.entityextraction.EntityExtractionParams;
import com.google.mlkit.nl.entityextraction.EntityExtractor;
import com.google.mlkit.nl.entityextraction.EntityExtractorOptions;
import com.google.mlkit.nl.entityextraction.MoneyEntity;


import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Activity demonstrating different image detector features with a still image from camera.
 */

@Obfuscate
public final class StillImageActivity extends AppCompatActivity implements TextInterface {

    private static final String TAG = "StillImageActivity";

    private static final String TEXT_RECOGNITION = "Text Recognition";

    private static final String SIZE_SCREEN = "w:screen"; // Match screen width
    private static final String SIZE_1024_768 = "w:1024"; // ~1024*768 in a normal ratio
    private static final String SIZE_640_480 = "w:640"; // ~640*480 in a normal ratio

    private static final String KEY_IMAGE_URI = "com.google.mlkit.vision.demo.KEY_IMAGE_URI";
    private static final String KEY_SELECTED_SIZE = "com.google.mlkit.vision.demo.KEY_SELECTED_SIZE";

    private static final int REQUEST_IMAGE_CAPTURE = 1001;
    private static final int REQUEST_CHOOSE_IMAGE = 1002;


    SharedPreferences sharedpreferences;
    public static final String MyPREFERENCES = "MyValues";

    private ImageView preview;
    private GraphicOverlay graphicOverlay;
    private String selectedMode = TEXT_RECOGNITION;
    private String selectedSize = SIZE_SCREEN;

    boolean isLandScape;

    private Uri imageUri;
    private int imageMaxWidth;
    private int imageMaxHeight;
    private VisionImageProcessor imageProcessor;
    TextView t;
    ConstraintLayout root;
    Matrix matrix = new Matrix();
    float scale = 1f;
    ScaleGestureDetector SGD;
    private float mScale = 1f;
    private ScaleGestureDetector mScaleDetector;
    GestureDetector gestureDetector;

    @EntityExtractorOptions.ModelIdentifier
    private String currentModel = EntityExtractorOptions.ENGLISH;
    private EntityExtractor entityExtractor;
    ArrayList<String> arrayList = new ArrayList<String>();
    int maxValue = 0;
    int countVal = 0;
    int countVal2 = 0;

    NestedScrollView scrollView;
    float pointx = 50;
    float pointy = 100;
    public int textmoneycount = 1;
    Button textselectdone;


    @SuppressLint("WrongViewCast")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_still_image);

        preview = findViewById(R.id.preview);
        graphicOverlay = findViewById(R.id.graphic_overlay);
        scrollView = findViewById(R.id.scrollView);
        textselectdone = (Button) findViewById(R.id.textselectdone);
        //    t=new TextView(this);

        TextGraphic.textInterface = this;

//    populateFeatureSelector();
//    populateSizeSelector();


        textselectdone.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                PasteText();
            }
        });

        ClipboardManager clipService = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clipData = ClipData.newPlainText("", "");
        clipService.setPrimaryClip(clipData);

        isLandScape =
                (getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE);

        if (savedInstanceState != null) {
            imageUri = savedInstanceState.getParcelable(KEY_IMAGE_URI);
            selectedSize = savedInstanceState.getString(KEY_SELECTED_SIZE);
        }

        gestureDetector = new GestureDetector(this, new GestureListener());

        // animation for scalling
//        mScaleDetector = new ScaleGestureDetector(this, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
//            @Override
//            public boolean onScale(ScaleGestureDetector detector) {
//                float scale = 1 - detector.getScaleFactor();
//
//                float prevScale = mScale;
//                mScale += scale;
//
//                if (mScale < 1f) // Minimum scale condition:
//                    mScale = 1f;
//
//                if (mScale > 10f) // Maximum scale condition:
//                    mScale = 10f;
//                ScaleAnimation scaleAnimation = new ScaleAnimation(1f / prevScale, 1f / mScale, 1f / prevScale, 1f / mScale, detector.getFocusX(), detector.getFocusY());
//                scaleAnimation.setDuration(0);
//                scaleAnimation.setFillAfter(true);
//                root.startAnimation(scaleAnimation);
//                return true;
//            }
//        });


        EntityExtractorOptions options = new EntityExtractorOptions.Builder(currentModel).build();
        entityExtractor = EntityExtraction.getClient(options);
        getLifecycle().addObserver(entityExtractor);

        View rootView = findViewById(R.id.root1);
        rootView
                .getViewTreeObserver()
                .addOnGlobalLayoutListener(
                        new OnGlobalLayoutListener() {
                            @Override
                            public void onGlobalLayout() {
                                rootView.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                                imageMaxWidth = rootView.getWidth();
//                imageMaxHeight = rootView.getHeight() - findViewById(R.id.control).getHeight();
                                imageMaxHeight = rootView.getHeight();
                                if (SIZE_SCREEN.equals(selectedSize)) {
                                    tryReloadAndDetectInImage();
                                }
                            }
                        });

        SGD = new ScaleGestureDetector(this, new ScaleListener());
    }


    private class ScaleListener extends ScaleGestureDetector.SimpleOnScaleGestureListener {
        @Override
        public boolean onScale(ScaleGestureDetector detector) {
            scale = scale * detector.getScaleFactor();
            scale = Math.max(1f, Math.min(scale, 5f));
            matrix.setScale(scale, scale);
//            root.setAnimationMatrix(matrix);
            return true;

        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {

        SGD.onTouchEvent(event);
        return true;
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "onResume");
        createImageProcessor();
        tryReloadAndDetectInImage();
    }


//
//  private void populateFeatureSelector() {
//    Spinner featureSpinner = findViewById(R.id.feature_selector);
//    List<String> options = new ArrayList<>();
//    options.add(TEXT_RECOGNITION);
//    // Creating adapter for featureSpinner
//    ArrayAdapter<String> dataAdapter = new ArrayAdapter<>(this, R.layout.spinner_style, options);
//    // Drop down layout style - list view with radio button
//    dataAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
//    // attaching data adapter to spinner
//    featureSpinner.setAdapter(dataAdapter);
//    featureSpinner.setOnItemSelectedListener(
//        new OnItemSelectedListener() {
//
//          @Override
//          public void onItemSelected(
//              AdapterView<?> parentView, View selectedItemView, int pos, long id) {
//            selectedMode = parentView.getItemAtPosition(pos).toString();
//            createImageProcessor();
//            tryReloadAndDetectInImage();
//          }
//
//          @Override
//          public void onNothingSelected(AdapterView<?> arg0) {}
//        });
//  }

//  private void populateSizeSelector() {
//    Spinner sizeSpinner = findViewById(R.id.size_selector);
//    List<String> options = new ArrayList<>();
//    options.add(SIZE_SCREEN);
////    options.add(SIZE_1024_768);
////    options.add(SIZE_640_480);
//
//    // Creating adapter for featureSpinner
//    ArrayAdapter<String> dataAdapter = new ArrayAdapter<>(this, R.layout.spinner_style, options);
//    // Drop down layout style - list view with radio button
//    dataAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
//    // attaching data adapter to spinner
//    sizeSpinner.setAdapter(dataAdapter);
//    sizeSpinner.setOnItemSelectedListener(
//        new OnItemSelectedListener() {
//
//          @Override
//          public void onItemSelected(
//              AdapterView<?> parentView, View selectedItemView, int pos, long id) {
//            selectedSize = parentView.getItemAtPosition(pos).toString();
//            createImageProcessor();
//            tryReloadAndDetectInImage();
//          }
//
//          @Override
//          public void onNothingSelected(AdapterView<?> arg0) {}
//        });
//  }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putParcelable(KEY_IMAGE_URI, imageUri);
        outState.putString(KEY_SELECTED_SIZE, selectedSize);
    }

//  private void startCameraIntentForResult() {
//    // Clean up last time's image
//    imageUri = null;
//    preview.setImageBitmap(null);
//
//    Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
//    if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
//      ContentValues values = new ContentValues();
//      values.put(MediaStore.Images.Media.TITLE, "New Picture");
//      values.put(MediaStore.Images.Media.DESCRIPTION, "From Camera");
//      imageUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
//      takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, imageUri);
//      startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE);
//    }
//  }

//  private void startChooseImageIntentForResult() {
//    Intent intent = new Intent();
//    intent.setType("image/*");
//    intent.setAction(Intent.ACTION_GET_CONTENT);
//    startActivityForResult(Intent.createChooser(intent, "Select Picture"), REQUEST_CHOOSE_IMAGE);
//  }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK) {
            tryReloadAndDetectInImage();
        } else if (requestCode == REQUEST_CHOOSE_IMAGE && resultCode == RESULT_OK) {
            // In this case, imageUri is returned by the chooser, save it.
            imageUri = data.getData();
            tryReloadAndDetectInImage();
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void tryReloadAndDetectInImage() {

//      Bitmap imageBitmap = BitmapUtils.getBitmapFromContentUri(getContentResolver(), imageUri);
        Bitmap resizedBitmap = ScannerConstants.selectedImageBitmap;
        if (resizedBitmap == null) {
            return;
        }

        // Clear the overlay first
        graphicOverlay.clear();

//    // Get the dimensions of the image view
//    Pair<Integer, Integer> targetedSize = getTargetedWidthHeight();
//
//    // Determine how much to scale down the image
//    float scaleFactor =
//        Math.max(
//            (float) imageBitmap.getWidth() / (float) targetedSize.first,
//            (float) imageBitmap.getHeight() / (float) targetedSize.second);
//
//    Bitmap resizedBitmap =
//        Bitmap.createScaledBitmap(
//        Bitmap.createScaledBitmap(
//            imageBitmap,
//            (int) (imageBitmap.getWidth() / scaleFactor),
//            (int) (imageBitmap.getHeight() / scaleFactor),
//            true);

        Display display = getWindowManager().getDefaultDisplay();
        int width = display.getWidth(); // ((display.getWidth()*20)/100)
        int height = display.getHeight();// ((display.getHeight()*30)/100)
        ConstraintLayout.LayoutParams parms = new ConstraintLayout.LayoutParams(width, height);
        preview.setLayoutParams(parms);

        preview.setImageBitmap(resizedBitmap);

        if (imageProcessor != null) {
            graphicOverlay.setImageSourceInfo(
                    resizedBitmap.getWidth(), resizedBitmap.getHeight(), /* isFlipped= */ false);
            imageProcessor.processBitmap(resizedBitmap, graphicOverlay);
        } else {
            Log.e(TAG, "Null imageProcessor, please check adb logs for imageProcessor creation error");
        }
        preview.setAlpha(0);
    }

    private Pair<Integer, Integer> getTargetedWidthHeight() {
        int targetWidth;
        int targetHeight;

        switch (selectedSize) {
            case SIZE_SCREEN:
                targetWidth = imageMaxWidth;
                targetHeight = imageMaxHeight;
                break;
            default:
                throw new IllegalStateException("Unknown size");
        }

        return new Pair<>(targetWidth, targetHeight);
    }

    private void createImageProcessor() {
        try {
            switch (selectedMode) {

                case TEXT_RECOGNITION:
                    imageProcessor = new TextRecognitionProcessor(this);
                    break;

                default:
                    Log.e(TAG, "Unknown selectedMode: " + selectedMode);
            }
        } catch (Exception e) {
            Log.e(TAG, "Can not create image processor: " + selectedMode, e);
            Toast.makeText(
                    getApplicationContext(),
                    "Can not create image processor: " + e.getMessage(),
                    Toast.LENGTH_LONG)
                    .show();
        }
    }

    @Override
    public void callback(String text, float pointx, float pointy, int count) {

        if (count == 0) {
            try {
                SharedPreferences pref = getApplicationContext().getSharedPreferences("MyPrefs", MODE_PRIVATE);
                int width = pref.getInt("bitmapwidth", 0);
                int height = pref.getInt("bitmapheight", 0);

                float newX = newCoords(pointx, pointy, width, height).get("newX");
                float newY = newCoords(pointx, pointy, width, height).get("newY");

                if (MySuperAppApplication.getTextorentity().equalsIgnoreCase("1")) {

                    textselectdone.setVisibility(View.VISIBLE);
                    textdrawparagraph(text, newX, newY, 0);

                } else {
//                    SpannableString ss1 = new SpannableString(text);
//                    ss1.setSpan(new CustomClickable(),0,text.length(),1);

                    extractEntities(text, newX, newY, 1);

                }


            } catch (Exception e) {
                e.printStackTrace();
            }
        }


    }

    private static EntityExtractionParams getEntityExtractionParams(String input) {
        return new EntityExtractionParams.Builder(input).build();
    }

    private HashMap<String, Float> newCoords(float oldX, float oldY, int oldResX, int oldResY) {

        float newX = oldX / oldResX * newResolution().get("getX");
        float newY = oldY / oldResY * newResolution().get("getY");

        HashMap<String, Float> newCordinates = new HashMap<>();
        newCordinates.put("newX", newX);
        newCordinates.put("newY", newY);

        return newCordinates;
    }

    private HashMap<String, Integer> newResolution() {

//    DisplayMetrics displayMetrics = new DisplayMetrics();
//    WindowManager wm = (WindowManager) getApplicationContext().getSystemService(Context.WINDOW_SERVICE); // the results will be higher than using the activity context object or the getWindowManager() shortcut
//    wm.getDefaultDisplay().getMetrics(displayMetrics);
//
//    int screenWidth = displayMetrics.widthPixels;
//    int screenHeight = displayMetrics.heightPixels;
        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getSize(size);
        int screenWidth = size.x;
        int screenHeight = size.y;

        HashMap<String, Integer> newResolution = new HashMap<>();
        newResolution.put("getX", screenWidth);
        newResolution.put("getY", screenHeight);

        return newResolution;
    }

    public void extractEntities(final String input, float pointx, float pointy, int flag) {

        checknumber(input, pointx, pointy);
        countVal++;

        entityExtractor
                .downloadModelIfNeeded()
                .onSuccessTask(ignored -> entityExtractor.annotate(getEntityExtractionParams(input)))
                .addOnFailureListener(
                        e -> {
                            Log.e(TAG, "Annotation failed", e);
//                      output.setText(getString(R.string.entity_extraction_error));
                        })
                .addOnSuccessListener(
                        result -> {
                            countVal2++;
                            if (result.isEmpty()) {
                                return;
                            }
                            for (EntityAnnotation entityAnnotation : result) {
                                List<Entity> entities = entityAnnotation.getEntities();
                                String annotatedText = entityAnnotation.getAnnotatedText();

                                for (Entity entity : entities) {
                                    displayEntityInfo(annotatedText, entity, pointx, pointy);
                                }
                            }

                            if (countVal == countVal2) {
                                final Handler handler = new Handler(Looper.getMainLooper());
                                handler.postDelayed(new Runnable() {
                                    @Override
                                    public void run() {
                                        for (int i = 0; i < arrayList.size(); i++) {

                                            int val1 = Integer.parseInt(arrayList.get(i));

                                            if (val1 > maxValue) {
                                                maxValue = val1;
                                            }

                                        }

                                        Log.d("ANYVAL", String.valueOf(maxValue));
                                        maxValue = 0;
                                        countVal = 0;
                                        countVal2 = 0;

                                    }
                                }, 10000);

                            }

                        });


    }

    private void displayEntityInfo(String annotatedText, Entity entity, float pointx, float pointy) {
        switch (entity.getType()) {

            case Entity.TYPE_MONEY:
                displayMoneyEntityInfo(entity, annotatedText, pointx, pointy);
                break;
            case Entity.TYPE_EMAIL:
                displayMoneyEntityInfo(entity, annotatedText, pointx, pointy);
                break;
//            case annotatedText.length():
//            default:
////                displayDefaultInfo(annotatedText, pointx, pointy);
//                break;
        }
    }


    private void displayDefaultInfo(String annotatedText, float pointx, float pointy) {
//    output.append(getString(R.string.unknown_entity_info, annotatedText));
//    Toast.makeText(getApplicationContext(),annotatedText,Toast.LENGTH_SHORT).show();

        textdraw(annotatedText, pointx, pointy, 0);


    }

    private void displayMoneyEntityInfo(Entity entity, String annotatedText, float pointx, float pointy) {
        MoneyEntity moneyEntity = entity.asMoneyEntity();
        textdraw(annotatedText, pointx, pointy, 1);
        arrayList.add(String.valueOf(moneyEntity.getIntegerPart()));

        Log.d("ARRAY", arrayList.toString());

//        Toast.makeText(getApplicationContext(), moneyEntity.getUnnormalizedCurrency() + " : " + moneyEntity.getIntegerPart(), Toast.LENGTH_LONG).show();
//    output.append(getString(R.string.money_entity_info, annotatedText, moneyEntity.getUnnormalizedCurrency(), moneyEntity.getIntegerPart(), moneyEntity.getFractionalPart()));
        Log.d("MONEY1", annotatedText + " : " + moneyEntity.getUnnormalizedCurrency() + " : " + moneyEntity.getIntegerPart() + " : " + moneyEntity.getFractionalPart());
    }


    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    public void getRealSizeOfDisplay() {
        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        final int height = size.y;
        final int width = size.x;
        sharedpreferences = getApplicationContext().getSharedPreferences(MyPREFERENCES, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedpreferences.edit();
        editor.putInt("width", width);
        editor.putInt("height", height);
        editor.commit();
    }

    private class GestureListener extends GestureDetector.SimpleOnGestureListener {
        @Override
        public boolean onDown(MotionEvent e) {
            return true;
        }

        // event when double tap occurs
        @Override
        public boolean onDoubleTap(MotionEvent e) {
            // double tap fired.
            return true;
        }
    }

    // step 3: override dispatchTouchEvent()
    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        super.dispatchTouchEvent(event);
//        mScaleDetector.onTouchEvent(event);
        gestureDetector.onTouchEvent(event);
        return gestureDetector.onTouchEvent(event);
    }

    public void textdraw(String annotatedText, float pointx, float pointy, int flag) {

        root = findViewById(R.id.root1);
//            ScrollView scrollView = (ScrollView) findViewById(R.id.scrollView);//    t=new TextView(this);
        ConstraintLayout.LayoutParams dim = new ConstraintLayout.LayoutParams(ConstraintLayout.LayoutParams.WRAP_CONTENT, ConstraintLayout.LayoutParams.WRAP_CONTENT);
//       TableLayout.LayoutParams dim = new TableLayout.LayoutParams(TableLayout.LayoutParams.MATCH_PARENT,TableLayout.LayoutParams.WRAP_CONTENT);
//       TableRow.LayoutParams dim1=new
//        Log.d("TEXTLINE1", annotatedText + " = " + pointx + " = " + pointy);

        SpannableString ss1 = new SpannableString(annotatedText);
        TextView t = new TextView(this);
        t.setLayoutParams(dim);
        t.setX(pointx);
        t.setY(pointy);
        t.setTextSize(5);

//        t.setTextIsSelectable(true);
//        t.setText(annotatedText);
        if (flag == 1) {

            String text = t.getText().toString();
            t.setTextSize(15);

            checkstring(text);



//            t.setBackgroundColor(Color.GREEN);
            ss1.setSpan(new CustomClickable(), 0, ss1.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            t.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Toast.makeText(getApplicationContext(), ss1.toString(), Toast.LENGTH_SHORT).show();
                }
            });


        }


        t.setText(ss1);
        root.addView(t);

        this.setContentView(scrollView);
    }

    public void textdrawparagraph(String annotatedText, float pointx, float pointy, int flag) {

        root = findViewById(R.id.root1);
        ConstraintLayout.LayoutParams dim = new ConstraintLayout.LayoutParams(ConstraintLayout.LayoutParams.WRAP_CONTENT, ConstraintLayout.LayoutParams.WRAP_CONTENT);

        SpannableString ss1 = new SpannableString(annotatedText);
//        ss1.setSpan(new android.text.style.StyleSpan(Typeface.NORMAL), 0, ss1.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);

        TextView t = new TextView(this);
        t.setLayoutParams(dim);
        t.setX(pointx);
        t.setY(pointy);
        t.setTextSize(12);
        t.setTextIsSelectable(true);
        if (flag == 1) {
            ss1.setSpan(new CustomClickable(), 0, ss1.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);

//            t.setBackgroundColor(Color.GREEN);
        }
        t.setText(ss1);
        TableLayout tableLayout = new TableLayout(this);
        tableLayout.setLayoutParams(new ConstraintLayout.LayoutParams(ConstraintLayout.LayoutParams.MATCH_PARENT, ConstraintLayout.LayoutParams.WRAP_CONTENT));
        TableRow tableRow = new TableRow(this);
        tableRow.setLayoutParams(new ConstraintLayout.LayoutParams(ConstraintLayout.LayoutParams.MATCH_PARENT, ConstraintLayout.LayoutParams.WRAP_CONTENT));
        tableRow.setGravity(Gravity.CENTER);
        tableRow.addView(t);
        tableLayout.addView(tableRow);
//        root.addView(t);
        root.addView(tableLayout);

        Toast.makeText(getApplicationContext(), "Select & Copy Text to Procced", Toast.LENGTH_SHORT).show();
        this.setContentView(scrollView);
    }

    public String checkstring(String args) {
        String sample = "krishna";
        char[] chars = args.toCharArray();
        StringBuilder sb = new StringBuilder();
        for (char c : chars) {
            if (Character.isDigit(c)) {
                sb.append(c);
            }
        }
        System.out.println(sb);
        Log.d("STRINGVAL", args + " : " + sb);
        return String.valueOf(sb);
    }

    public void checknumber(String args, float pointx, float pointy) {


        if (args.matches("[0-9,.]+") && args.length() > 2) {
            textdraw(args, pointx, pointy, 1);

        } else {

//            if (args.matches("\\d+(?:\\.\\d+)?")) {
            if (args.matches("^\\d+(?:\\.\\d+)?$")) {
                textdraw(args, pointx, pointy, 1);
            } else {

                if (args.matches("[0-9 +]+") && args.length() > 2) {

//                    String regex = "(?<=[\\d])(,)(?=[\\d])";
//                    Pattern p = Pattern.compile(regex);
//                    Matcher m = p.matcher(args);
//                    args = m.replaceAll("");
//                    System.out.println(args);


                    String[] splited = args.split("\\s+");

                    String value1 = splited[0];
                    String value2 = splited[1];

                    float x = pointx;
                    if (value1.length() == 1) {
                        x = pointx + 10;
                    }
                    if (value1.length() == 2) {
                        x = pointx + 15;
                    }
                    if (value1.length() == 3) {
                        x = pointx + 20;
                    }
                    if (value1.length() == 4) {
                        x = pointx + 25;
                    }
                    if (value1.length() == 5) {
                        x = pointx + 30;
                    }
                    if (value1.length() == 6) {
                        x = pointx + 35;
                    }
                    if (value1.length() == 7) {
                        x = pointx + 40;
                    }
                    if (value1.length() == 8) {
                        x = pointx + 45;
                    }
                    if (value1.length() == 8) {
                        x = pointx + 50;
                    }
                    if (value1.length() == 9) {
                        x = pointx + 55;
                    }
                    if (value1.length() == 10) {
                        x = pointx + 60;
                    }

                    textdraw(value1, pointx, pointy, 1);
                    textdraw(value2, x, pointy, 1);

                } else {
//
//                    String regex = "(?<=[\\d]) +(?=[\\d])";
//                    Pattern p = Pattern.compile(regex);
//                    Matcher m = p.matcher(args);
//                    args = m.replaceAll(".");
//                    System.out.println(args);
//                    textdraw(args, pointx, pointy, 1);

                    textdraw(args, pointx, pointy, 0);
                }

            }
        }
    }

    public void PasteText() {
        ClipboardManager clipboardManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clipData = clipboardManager.getPrimaryClip();
        assert clipData != null;
        ClipData.Item item = clipData.getItemAt(0);
        if (item.getText().toString().equalsIgnoreCase("") || item == null) {
            Toast.makeText(getApplicationContext(), "Please Select & Copy Text", Toast.LENGTH_SHORT).show();
        } else {
            Bundle b = new Bundle();
            b.putString("selectedtext", item.getText().toString());
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_OK, intent);
            finish();
            Toast.makeText(getApplicationContext(), item.getText().toString(), Toast.LENGTH_SHORT).show();
            clipData = ClipData.newPlainText("", "");
            clipboardManager.setPrimaryClip(clipData);
        }
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        Bundle b = new Bundle();
        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_CANCELED, intent);
        finish();

    }

}
