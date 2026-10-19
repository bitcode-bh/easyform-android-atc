package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Bitmap.Config;
import android.graphics.BitmapFactory;
import android.graphics.BitmapFactory.Options;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Paint.Style;
import android.graphics.Typeface;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Build.VERSION;
import android.os.Build.VERSION_CODES;
import android.os.Bundle;
import android.os.Environment;
import android.provider.DocumentsContract;
import android.provider.MediaStore;
import android.provider.MediaStore.Images;
import android.provider.Settings;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.math.BigDecimal;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileChannel.MapMode;
import java.security.InvalidKeyException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.SecretKey;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class cameraactivity extends Activity {

    Uri outputFileUri;
    String phy_path;
    private SQLiteDatabase database;
    File imagesFolder;
    int ret;
    long time;
    File image_encry;
    File image_decry;
    B_new b_count = new B_new();

    Cipher cipher = null;
    SecretKey secretKey = null;
    MySharedPreferences pref;
    int count;
    File image;
    Uri mCapturedImageURI;
    String t;
    String b_write;
    String mCurrentPhotoPath;
    String width, height, quality, drawflag;
    String path_mm;
    int rot = 0;
    private static final int PERMISSION_REQUEST_CODE = 200;
    String max_file_size;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        pref = sqlitewraper.getSecureShared("MyPref");
        b_count.setCount_new(0);

        if (checkPermission()) {
            opencamera();
        } else {
            requestPermission();
        }

    }
    private void opencamera()
    {
        pref.putString("photo_path", ""); // Saving string
        pref.commit();
        String time1 = pref.getString("time", "k2");

        String time2 = pref.getString("time2", "k2");
        b_write = pref.getString("b_write", "k2");

        Bundle Extras = getIntent().getExtras();
        width = Extras.getString("width");
        height = Extras.getString("height");
        quality = Extras.getString("quality");
        drawflag = Extras.getString("drawflag");
        max_file_size = Extras.getString("max_file_size");
        try {
            if (!time2.equalsIgnoreCase(time1)) {

                pref.putString("time2", time1); // Saving string
                pref.commit();

                time = System.currentTimeMillis();

                imagesFolder = new File(
                        com.sky.atc.easyformse.utils.AppStorage.root(), "Easy_form");

                imagesFolder.mkdirs();

                image = new File(imagesFolder, time + ".jpg");

                phy_path = image.getAbsolutePath();



                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                    outputFileUri = FileProvider.getUriForFile(this, getApplicationContext().getPackageName() + ".provider", image);
                }else {
                    outputFileUri = Uri.fromFile(image);
                }

                pref.putString("outputuri", phy_path); // Saving
                pref.commit();
                startCameraActivity();
            }
        } catch (Exception e) {

            Toast.makeText(this, "Error occured. Please try again later.",
                    Toast.LENGTH_SHORT).show();
            finish();
        }
    }
    protected void startCameraActivity() {

        File photoFile = null;
        try {
            photoFile = createImageFile();
        } catch (Exception ignored) {

        }

        Intent cameraIntent = new Intent(
                MediaStore.ACTION_IMAGE_CAPTURE);

        if (photoFile != null) {

            path_mm += "path:" + phy_path;
            cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, outputFileUri);
            pref.putString("outputuri", phy_path); // Saving
            pref.commit();

        } else {

            path_mm += "path:" + phy_path;
            cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, outputFileUri);

            pref.putString("outputuri", phy_path); // Saving
            pref.commit();
            path_mm += "\n path_else:" + phy_path;

        }

        this.startActivityForResult(cameraIntent, 102);

    }

    @RequiresApi(api = VERSION_CODES.KITKAT)
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        path_mm = "Onsuccess";
        generateNoteOnSD("photo1.txt", path_mm);


        //Result from drawing Activity easy_draw_new.java
        if (requestCode == 111) {

            data d = new data();
            if (d.getRet() == 1 && data == null) {

                if (resultCode == android.app.Activity.RESULT_OK) {
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
                if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
                    Bundle bundle = data.getExtras();
                    //status is path of photo
                    String status = bundle.getString("status");
                    ret = bundle.getInt("ret");

                    pref.putString("photo_path", status); // Saving string
                    pref.commit(); // commit changes

                    Bundle b = new Bundle();

                    b.putString("status", status);
                    Intent intent1 = new Intent();
                    intent1.putExtras(b);
                    setResult(RESULT_OK, data);
                    b_count.setPath_final(status);
                    finish();

                }
                //in case of crash will not receive Activity.RESULT_CANCELED or OK
                else if (data == null && resultCode != Activity.RESULT_CANCELED) {

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

        //Return Native camera result with path to camera_new plugin
        if (resultCode == android.app.Activity.RESULT_OK && requestCode == 102) {

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
        } else {

            Bundle b = new Bundle();

            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);

            finish();

        }

    }

    //Create photo on physical path which is saved in sharedPreference
    //in case draw feature is enable it will call activity easy_draw_new.java
    //for which result will be received with request code 111
    void bitmap() {

        generateNoteOnSD("photo3.txt", path_mm + "\n" + "bitmap");
        try {
            BitmapFactory.Options options = new Options();
            options.inInputShareable = true;

            if (VERSION.SDK_INT >= VERSION_CODES.HONEYCOMB) {

                options.inMutable = true;
            }
            options.inSampleSize = 8;

            pref = sqlitewraper.getSecureShared("MyPref");
            String mCaptured = pref.getString("outputuri", "k2");

            path_mm += "\n bitmap:" + mCaptured;

            File pictureFile = new File(mCaptured);

            //Draw flag is for geo tagging information
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
                } catch (Exception ignored) {

                }


                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                String dateTime = sdf.format(Calendar.getInstance().getTime()); // reading


                MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
                int max_width = prefs.getInt("max_width", 0);
                int max_height = prefs.getInt("max_height", 0);

                if (max_height == 0 && max_width == 0) {
                    max_height = Integer.parseInt(height);
                    max_width = Integer.parseInt(width);
                }

                bitmap = Bitmap.createScaledBitmap(bitmap, max_width,
                        max_height, true);


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

                        String lat = pref.getString("lat", "0");

                        String lon = pref.getString("lon", "0");

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

                    if ((rotation == 90 || rotation > 1) && rot == 0) {
                        bitmap = rotateImage(bitmap, 90);
                        angle++;

                    }
                    ExifInterface ei = new ExifInterface(mCaptured);
                    rotation = ei.getAttributeInt(ExifInterface.TAG_ORIENTATION,
                            ExifInterface.ORIENTATION_UNDEFINED);
                    if ((rotation == 90 || rotation > 1) && angle == 0 && rot == 0) {
                        bitmap = rotateImage(bitmap, 90);

                    }
                    if (b_write.equals("true")) {


                        int textsize = 15;
                        float textsize1 = 20f;
                        float textsize2 = 15f;
                        float textsize3 = 40f;
                        float textsize4 = 65f;
                        float textsize5 = 90f;
                        float right = 250f;
                        float bottom = 125f;
                        if (max_width != 0) {

                            if (max_width > 1080) {

                                textsize = 40;
                                textsize1 = 40f;
                                textsize2 = 15f;
                                textsize3 = 50f;
                                textsize4 = 85f;
                                textsize5 = 115f;
                                right = 625f;
                                bottom = 200f;
                            }
                        }

                        Canvas cs = new Canvas(bitmap);
                        Paint tPaint = new Paint();
                        Paint tPaint1 = new Paint();
                        tPaint.setTextSize(textsize);
                        tPaint.setColor(Color.BLACK);
                        tPaint1.setColor(Color.WHITE);
                        tPaint1.setAlpha(80);
                        tPaint.setTypeface(Typeface.create("Arial", Typeface.BOLD));
                        tPaint.setAntiAlias(true);
                        tPaint.setStyle(Style.FILL);
                        float height1 = tPaint.measureText("yY");
                        cs.drawRect(0, 0, right, bottom, tPaint1);
                        cs.drawText(dateTime, textsize1, height1 + textsize2, tPaint);
                        cs.drawText(lat_str, textsize1, height1 + textsize3, tPaint);
                        cs.drawText(long_str, textsize1, height1 + textsize4, tPaint);
                        cs.drawText("username :" + username, textsize1, height1 + textsize5, tPaint);
                    }

                    bitmap.compress(Bitmap.CompressFormat.JPEG, Integer
                            .valueOf(quality), new FileOutputStream(new File(
                            mCaptured)));

                } catch (Exception ignored) {

                }
                // ---------------------------
                bitmap.recycle();

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

    @Override
    public void onBackPressed() {

        Bundle b = new Bundle();

        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_CANCELED, intent);

        finish();
        // TODO Auto-generated method stub
        super.onBackPressed();

    }

    public Uri getImageUri(Context inContext, Bitmap inImage) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        inImage.compress(Bitmap.CompressFormat.JPEG, 100, bytes);
        String path = Images.Media.insertImage(inContext.getContentResolver(),
                inImage, "Title", null);
        return Uri.parse(path);
    }

    public String getRealPathFromURI(Uri uri) {
        Cursor cursor = getContentResolver().query(uri, null, null, null, null);
        cursor.moveToFirst();
        int idx = cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATA);
        return cursor.getString(idx);
    }

    private File createImageFile() throws IOException {
        // Create an image file name
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss")
                .format(new Date());
        String imageFileName = "Easy_" + timeStamp + "_";
        File storageDir = com.sky.atc.easyformse.utils.AppStorage.pictures();
        File image = File.createTempFile(imageFileName, /* prefix */
                ".jpg", /* suffix */
                storageDir /* directory */
        );

        // Save a file: path for use with ACTION_VIEW intents
        mCurrentPhotoPath = "file:" + image.getAbsolutePath();
        return image;
    }

    //Convert Bitmap to mutable for editing
    public static Bitmap convertToMutable(final Context context,
                                          final Bitmap imgIn) {
        final int width = imgIn.getWidth(), height = imgIn.getHeight();
        final Config type = imgIn.getConfig();
        File outputFile = null;
        final File outputDir = context.getCacheDir();
        try {
            outputFile = File.createTempFile(
                    Long.toString(System.currentTimeMillis()), null, outputDir);
            outputFile.deleteOnExit();
            final RandomAccessFile randomAccessFile = new RandomAccessFile(
                    outputFile, "rw");
            final FileChannel channel = randomAccessFile.getChannel();
            final MappedByteBuffer map = channel.map(MapMode.READ_WRITE, 0,
                    imgIn.getRowBytes() * height);
            imgIn.copyPixelsToBuffer(map);
            imgIn.recycle();
            final Bitmap result = Bitmap.createBitmap(width, height, type);
            map.position(0);
            result.copyPixelsFromBuffer(map);
            channel.close();
            randomAccessFile.close();
            outputFile.delete();
            return result;
        } catch (final Exception e) {
        } finally {
            if (outputFile != null)
                outputFile.delete();
        }
        return null;
    }

    public void generateNoteOnSD(String sFileName, String sBody) {
        try {
            File root = new File(com.sky.atc.easyformse.utils.AppStorage.root(),
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

    @RequiresApi(api = VERSION_CODES.KITKAT)
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
                    return com.sky.atc.easyformse.utils.AppStorage.root() + "/"
                            + split[1];
                }

                // TODO handle non-primary volumes
            }
            // DownloadsProvider
            else if (isDownloadsDocument(uri)) {

                final String id = DocumentsContract.getDocumentId(uri);
                final Uri contentUri = ContentUris.withAppendedId(
                        Uri.parse("content://downloads/public_downloads"),
                        Long.valueOf(id));

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

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is DownloadsProvider.
     */
    public static boolean isDownloadsDocument(Uri uri) {
        return "com.android.providers.downloads.documents".equals(uri
                .getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is MediaProvider.
     */
    public static boolean isMediaDocument(Uri uri) {
        return "com.android.providers.media.documents".equals(uri
                .getAuthority());
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is Google Photos.
     */
    public static boolean isGooglePhotosUri(Uri uri) {
        return "com.google.android.apps.photos.content".equals(uri
                .getAuthority());
    }

    public static Bitmap rotateImage(Bitmap source, float angle) {
        Bitmap retVal;

        Matrix matrix = new Matrix();
        matrix.postRotate(angle);
        retVal = Bitmap.createBitmap(source, 0, 0, source.getWidth(),
                source.getHeight(), matrix, true);

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
        mediaCursor.close();
        return rotation;
    }

    //check the image ori
    private Bitmap imageOreintationValidator(Bitmap bitmap, String path) {

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
            ////////////e.printStackTrace();
        }

        return bitmap;
    }

    void getresult(File path) {

        MySharedPreferences prefs = sqlitewraper.getSecureShared("Size");
        int width1 = prefs.getInt("max_width", 0);
        int height1 = prefs.getInt("max_height", 0);

        String max_width = String.valueOf(width1);
        String max_height = String.valueOf(height1);

        if (max_height.equals("0") && max_width.equals("0")) {
            max_height = height;
            max_width = width;
        }

        Intent i = new Intent(sqlitewraper.context, easy_draw_new.class);
        i.putExtra("File", path);
        i.putExtra("b_write", b_write);
        i.putExtra("width", max_width);
        i.putExtra("quality", quality);
        i.putExtra("height", max_height);
        i.putExtra("flagdraw", "1");
        i.putExtra("drawflag", "1");
        i.putExtra("serverwidth", width);
        i.putExtra("serverheight", height);
        i.putExtra("picclicklat", "0.0");
        i.putExtra("picclicklng", "0.0");
        i.putExtra("cameraview", -1);
        i.putExtra("max_file_size",max_file_size);
        startActivityForResult(i, 111);

    }
    private boolean checkPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) +
                ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            return false;
        }
        return true;
    }

    private void requestPermission() {

        ActivityCompat.requestPermissions(cameraactivity.this,
                new String[]{Manifest.permission.CAMERA,Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE},
                PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        switch (requestCode) {
            case PERMISSION_REQUEST_CODE:
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                        && grantResults[1] == PackageManager.PERMISSION_GRANTED
                        && grantResults[2] == PackageManager.PERMISSION_GRANTED) {
                    // Toast.makeText(getApplicationContext(), "Permission Granted", Toast.LENGTH_SHORT).show();
                    opencamera();
                    // main logic
                } else {
                    // Toast.makeText(getApplicationContext(), "Permission Denied", Toast.LENGTH_SHORT).show();
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) +
                            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

                        showMessageOKCancel("You need to allow access camera & file and media permissions",
                                new DialogInterface.OnClickListener() {
                                    @Override
                                    public void onClick(DialogInterface dialog, int which) {
                                        Intent intent = new Intent();
                                        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                                        intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                                        mainactivity.startActivity(intent);
                                        finish();
                                    }
                                });

                    }
                }
                break;
        }
    }

    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(cameraactivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }

}