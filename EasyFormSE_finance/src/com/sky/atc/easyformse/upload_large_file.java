package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.ProgressDialog;
import android.content.ClipData;
import android.content.ContentUris;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
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
import android.graphics.Typeface;
import android.location.Location;
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
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.exifinterface.media.ExifInterface;

import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.math.BigDecimal;
import java.net.URISyntaxException;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileChannel.MapMode;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

import io.michaelrocks.paranoid.Obfuscate;


//Browse file from local storage and send Back to UI
@Obfuscate
public class upload_large_file extends Activity {

    private final int SELECT_PHOTO = 1;
    private final int SELECT_PDF = 2;
    Uri outputFileUri;
    String phy_path;
    ImageView img;
    File imagesFolder;
    MySharedPreferences pref;
    Button btn_submit, btn_cancel, btn_retake;
    String path_new;
    String path;
    String path1;
    String b_write;
    String width, height, quality;
    String docpick;
    TextView pdftext;
    WebView webView;
    String extMobstring;
    String[] mimetypes = new String[0];
    private SQLiteDatabase database;
    private ProgressDialog progress;
    String info ="info";
    double deviceLat;
    double deviceLng;
    private GoogleApiClient googleApiClient;
    String picdevicelat, picdevicelng;
    String max_file_size;
    ArrayList<String> selectedImagePaths = new ArrayList<>();
    String allow_multiple_image;
    private static final int PERMISSION_REQUEST_CODE = 201;
    OnClickListener m = new OnClickListener() {

        @Override
        public void onClick(View v) {
            if (v.getId() == 3) {

                if (docpick.equals("1")) {

                    if(allow_multiple_image.equalsIgnoreCase("true"))
                    {
//                        Intent photoPickerIntent = new Intent(Intent.ACTION_PICK);
                        Intent photoPickerIntent = new Intent(Intent.ACTION_GET_CONTENT);
                        photoPickerIntent.setType("image/*");
                        photoPickerIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                        startActivityForResult(photoPickerIntent, SELECT_PHOTO);
                    }
                    else {
//                        Intent photoPickerIntent = new Intent(Intent.ACTION_PICK); set new action because not working redmi a3 device 16-09-2024
                        Intent photoPickerIntent = new Intent(Intent.ACTION_GET_CONTENT);
                        photoPickerIntent.setType("image/*");
                        startActivityForResult(photoPickerIntent, SELECT_PHOTO);
                    }


                }
                if (docpick.equals("2")) {

                    Intent photoPickerIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    photoPickerIntent.addCategory(Intent.CATEGORY_OPENABLE);

                    photoPickerIntent.setType("*/*");
//                  String[] mimetypes = {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/pdf", "application/vnd.ms-excel", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/*", "text/*", "audio/*", "video/*"};
                    photoPickerIntent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);
                    startActivityForResult(photoPickerIntent, SELECT_PDF);
                }

            }

            if (v.getId() == 1) {

//                bitmap1(path);
                pref.putString("photo_path", path); // Saving string
                pref.commit();
                Bundle b = new Bundle();

                if (docpick.equals("2")) {

                    b.putString("status", path);
                }
                if (docpick.equals("1")) {

                    if(allow_multiple_image.equalsIgnoreCase("true"))
                    {
                        b.putString("status", selectedImagePaths.toString());
                    }
                    else {
                        b.putString("status", path);
                    }
                }
                Intent intent = new Intent();
                intent.putExtras(b);
                setResult(RESULT_OK, intent);
                finish();

            } else if (v.getId() == 2) {

                pref.putString("photo_path", ""); // Saving string
                pref.commit();

                Intent intent = new Intent();
                setResult(RESULT_CANCELED, intent);
                finish();
            }

            // TODO Auto-generated method stub
        }
    };

    public static String getPath(final Context context, final Uri uri) {

        final boolean isKitKat = VERSION.SDK_INT >= VERSION_CODES.KITKAT;
        String filePath = "";
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
                } else {

                    filePath = "/storage/" + type + "/" + split[1];
                    return filePath;
                }


                // TODO handle non-primary volumes
            }
            // DownloadsProvider
            else if (isDownloadsDocument(uri)) {
                final String id = DocumentsContract.getDocumentId(uri);
                if (id != null && id.startsWith("raw:")) {
                    return id.substring(4);
                }
                String[] contentUriPrefixesToTry = new String[]{
                        "content://downloads/public_downloads",
                        "content://downloads/my_downloads",
                        "content://downloads/all_downloads"
                };
                for (String contentUriPrefix : contentUriPrefixesToTry) {
                    try {
                        Uri  contentUri = ContentUris.withAppendedId(Uri.parse(contentUriPrefix), Long.valueOf(id));
                        return getDataColumn(context, contentUri, null, null);
                    } catch (NumberFormatException e) {
                        //In Android 8 and Android P the id is not a number
                        return uri.getPath().replaceFirst("^/document/raw:", "").replaceFirst("^raw:", "");
                    }
                }
            }
            // MediaProvider
            else if (isMediaDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];

                Uri contentUri = null;
                if ("image".equals(type)) {
                    contentUri = Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video".equals(type)) {
                    contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio".equals(type)) {
                    contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                } else {
                    contentUri = MediaStore.Files.getContentUri("external");
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
            return result;
        } catch (final Exception ignored) {
        }
        return null;
    }

    public static String getFilePath(Context context, Uri uri) throws URISyntaxException {
        String selection = null;
        String[] selectionArgs = null;
        // Uri is different in versions after KITKAT (Android 4.4), we need to
        if (Build.VERSION.SDK_INT >= 19 && DocumentsContract.isDocumentUri(context.getApplicationContext(), uri)) {
            if (isExternalStorageDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                return Environment.getExternalStorageDirectory() + "/" + split[1];
            } else if (isDownloadsDocument(uri)) {
                final String id = DocumentsContract.getDocumentId(uri);
                uri = ContentUris.withAppendedId(
                        Uri.parse("content://downloads/public_downloads"), Long.valueOf(id));
            } else if (isMediaDocument(uri)) {
                final String docId = DocumentsContract.getDocumentId(uri);
                final String[] split = docId.split(":");
                final String type = split[0];
                if ("image".equals(type)) {
                    uri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                } else if ("video".equals(type)) {
                    uri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                } else if ("audio".equals(type)) {
                    uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }
                selection = "_id=?";
                selectionArgs = new String[]{
                        split[1]
                };
            }
        }
        if ("content".equalsIgnoreCase(uri.getScheme())) {
            String[] projection = {
                    MediaStore.Images.Media.DATA
            };
            Cursor cursor;
            try {
                cursor = context.getContentResolver()
                        .query(uri, projection, selection, selectionArgs, null);
                int column_index = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
                if (cursor.moveToFirst()) {
                    return cursor.getString(column_index);
                }
            } catch (Exception e) {
            }
        } else if ("file".equalsIgnoreCase(uri.getScheme())) {
            return uri.getPath();
        }
        return null;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (checkPermission()) {
            //main logic or main code
        } else {
            requestPermission();
        }
        pref = sqlitewraper.getSecureShared("MyPref");
        database = sqlitewraper.getDatabase(); //for imei
        googleApiClient = sqlitewraper.getGoogleApiHelper().getGoogleApiClient();
        Bundle Ex = getIntent().getExtras();

        b_write = Ex.getString("b_write");
        width = Ex.getString("width");
        height = Ex.getString("height");
        quality = Ex.getString("quality");
//        docpick="2";
        docpick = Ex.getString("p");
//      for getting browse string
        extMobstring = Ex.getString("mob_ext");
        info = Ex.getString("info");
        max_file_size = Ex.getString("max_file_size");
        allow_multiple_image = Ex.getString("allow_multiple_image");
        try {
            pref.putString("photo_path", ""); // Saving string
            pref.commit();
            setContentView(R.layout.large);
            btn_submit = (Button) findViewById(R.id.btn_yes);
            btn_submit.setId(1);
            btn_submit.setOnClickListener(m);
            btn_retake = (Button) findViewById(R.id.btn_regain);
            btn_retake.setId(3);
            btn_retake.setOnClickListener(m);

            btn_cancel = (Button) findViewById(R.id.btn_no);

            btn_cancel.setId(2);
            btn_cancel.setOnClickListener(m);
            img = ((ImageView) findViewById(R.id.imageView));

            pdftext = (TextView) findViewById(R.id.pdftext);

            if (docpick.equals("1")) {
                if(allow_multiple_image.equalsIgnoreCase("true"))
                {
//                    Intent photoPickerIntent = new Intent(Intent.ACTION_PICK);
                    Intent photoPickerIntent = new Intent(Intent.ACTION_GET_CONTENT);
                    photoPickerIntent.setType("image/*");
                    photoPickerIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(photoPickerIntent, SELECT_PHOTO);
                }
                else {
//                    Intent photoPickerIntent = new Intent(Intent.ACTION_PICK); // set new action because not working redmi a3 device 16-09-2024
                    Intent photoPickerIntent = new Intent(Intent.ACTION_GET_CONTENT);
                    photoPickerIntent.setType("image/*");
                    startActivityForResult(photoPickerIntent, SELECT_PHOTO);
                }

            }
            if (docpick.equals("2")) {


                ArrayList<String> mimetypes2 = new ArrayList<>();

                Intent photoPickerIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                photoPickerIntent.addCategory(Intent.CATEGORY_OPENABLE);
                photoPickerIntent.setType("*/*");


                if (!extMobstring.equals("")) {

                    String[] array = extMobstring.split(",");
                    for (int i = 0; i < array.length; i++) {
                        System.out.println(array[i]);
                        mimetypes = new String[]{};
                        mimetypes2.add(array[i]);

                    }
                    String[] countriesArray = mimetypes2.toArray(new String[mimetypes2.size()]);
                    mimetypes = countriesArray;
                } else {
                    mimetypes = new String[]{"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/pdf", "application/vnd.ms-excel", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/*", "text/*", "audio/*", "video/*"};
                }
                photoPickerIntent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);
                startActivityForResult(photoPickerIntent, SELECT_PDF);

            }

        } catch (Exception e) {

            Toast.makeText(this, "Error occured. Please try again later.",
                    Toast.LENGTH_SHORT).show();
            finish();
        }

    }

    void bitmap(String imagepath) {
        try {

            progress = new ProgressDialog(upload_large_file.this);
            progress.setCancelable(true);
            progress.setMessage("Loading...");
            progress.setProgressStyle(ProgressDialog.STYLE_SPINNER);
            progress.setProgress(0);
            progress.setMax(100);
            progress.show();

            Options options = new Options();
            options.inInputShareable = true;
            options.inPurgeable = true;
            options.inMutable = true;
            options.inPreferredConfig = Config.RGB_565;
            options.inDither = true;
            progress.cancel();
            Bitmap bitmap = null;
            if(b_write.equals("true"))
            {
                bitmap = setPic(imagepath, width, height, "c");
            }
            else {
                bitmap = setPic(imagepath, "", "", "c");
            }
            img.setImageBitmap(bitmap);

        } catch (Exception ignored) {
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

    // upload all photos of current t_id which has flag 0
    public int upload_photo(String username, String u_c, String p_url) {
        int k = 0;
        try {
            String s_pname = "maulik" + ".jpg";

            // ----------------call webservice----------------------------//


            File imageFile;

            Options options = new Options();
            options.inInputShareable = true;
            options.inPurgeable = true;
            imageFile = new File(p_url);

            FileInputStream fis = new FileInputStream(imageFile);
            Bitmap bitmap = BitmapFactory.decodeFileDescriptor(fis.getFD(),
                    null, options);
            ByteArrayOutputStream stream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, stream);
            byte[] image = stream.toByteArray();
            String img_str = Base64.encodeBytes(image);

            JSONObject data1 = new JSONObject();
            data1.put("siteid", 3687);
            data1.put("stepid", 0);
            data1.put("ques_id", 119);
            data1.put("servertaskid", 11765);
            data1.put("inspectioncounter", 1);
            data1.put("check_type", 259);
            data1.put("fileName", s_pname);
            data1.put("buffer", img_str);
            JSONObject data2 = new JSONObject();
            data2.put("username", username);
            data2.put("u_c", u_c);

        } catch (Exception e) {

            if (!(e instanceof FileNotFoundException)) {
                k++;

            }
        }
        return k;
    }


    @Override
    protected void onActivityResult(int requestCode, int resultCode,
                                    Intent imageReturnedIntent) {
        super.onActivityResult(requestCode, resultCode, imageReturnedIntent);

        switch (requestCode) {

            case SELECT_PDF:

                if (resultCode == RESULT_OK) {
                    final Uri imageUri = imageReturnedIntent.getData();
                    try {

                        path = getPath(context, imageUri);
                        if (path == null) {
                            path = imageReturnedIntent.getData().getPath();
                        }
                        File f = new File(path);
                        if (!f.exists()) {

                            alert("You can't select File from google drive, Please select File from storage");

                        }

                        File file = new File(path);
                        long lengthoffile = file.length();
                        lengthoffile = lengthoffile / 1024;

                        int filesize = Integer.parseInt(max_file_size) * 1000;
                        //Only Less than 5MB of file size allowed
                        if (lengthoffile < filesize) {
                            String path = file.getAbsolutePath();
                            String filename = path.substring(path.lastIndexOf("/") + 1);
                            if(filename.length() >= 30)
                            {
                                alert(" File name is too Long ! \n File name must not exceed 30 characters.");
                            }
                            else {

                                pdftext.setVisibility(View.VISIBLE);
                                pdftext.setText(filename);
                                img.setImageResource(R.drawable.documentlogo);
                            }
                        } else {

                            System.out.print("hi");
                            alert(" File size is too big ! \n File size must be less than "+ max_file_size+"MB!");
                        }

                    } catch (Exception e) {

                        pref.putString("photo_path", ""); // Saving string
                        pref.commit();
                        Intent intent = new Intent();
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

                break;


            case SELECT_PHOTO:

                if (resultCode == RESULT_OK) {

                    try {

                        if(allow_multiple_image.equalsIgnoreCase("true"))
                        {
                            if (imageReturnedIntent.getClipData() != null) {
                                ClipData clipData = imageReturnedIntent.getClipData();
                                for (int i = 0; i < clipData.getItemCount(); i++) {
                                    Uri uri = clipData.getItemAt(i).getUri();
                                    path = getPath(context, uri);
                                    // Handle the selected image path here
                                    selectedImagePaths.add(path);
                                    // System.out.println("imagepath--" + selectedImagePaths.toString());
                                }
                            }
                        }
                        else {
                            final Uri imageUri = imageReturnedIntent.getData();

                            // String path1 = imageUri.getPath();
                            path = getPath(context, imageUri);
                        }

                        File file = new File(path);
                        long lengthoffile = file.length();
                        lengthoffile = lengthoffile / 1024;

                        int filesize = Integer.parseInt(max_file_size) * 1000;
                        //Only Less than 5MB of file size allowed
                        if (lengthoffile < filesize) {

                        }
                        else {

                            System.out.print("hi");
                            alert(" File size is too big ! \n File size must be less than " + max_file_size+"MB!");
                        }

                        bitmap(path);

                    } catch (Exception e) {

                        pref.putString("photo_path", ""); // Saving string
                        pref.commit();
                        Intent intent = new Intent();
                        setResult(RESULT_CANCELED, intent);
                        finish();
                        ////e.printStackTrace()();
                    }

                } else {
                    Bundle b = new Bundle();

                    Intent intent = new Intent();
                    intent.putExtras(b);
                    setResult(RESULT_CANCELED, intent);

                    finish();

                }
                break;

        }
    }

    protected int sizeOf(Bitmap data) {
        if (VERSION.SDK_INT < VERSION_CODES.HONEYCOMB_MR1) {
            return data.getRowBytes() * data.getHeight();
        } else {
            return data.getByteCount();
        }
    }

    private Bitmap setPic(String imagePath, String width, String height,
                          String p) throws JSONException, IOException {
        int targetW;
        int targetH;
        if (p.equalsIgnoreCase("set")) {

            targetW = Integer.parseInt(width);
            targetH = Integer.parseInt(height);

        } else {
            targetW = 800;
            targetH = 800;
        }

        // Get the dimensions of the bitmap
        Options bmOptions = new Options();

        int photoW = bmOptions.outWidth;
        int photoH = bmOptions.outHeight;

        // Determine how much to scale down the image
        int scaleFactor = Math.min(photoW / targetW, photoH / targetH);

        // Decode the image file into a Bitmap sized to fill the View
        bmOptions.inJustDecodeBounds = false;
        bmOptions.inSampleSize = scaleFactor;
        bmOptions.inPurgeable = true;
        if (VERSION.SDK_INT >= VERSION_CODES.HONEYCOMB) {

            bmOptions.inMutable = true;
        }

        Bitmap bitmap = BitmapFactory.decodeFile(imagePath, bmOptions);

        if (b_write.equals("true")) {

            Bitmap mBitmap = null;
            String lat_str = null;
            String long_str = null;
            String username = null;

            //mBitmap = bitmap;
            mBitmap = imageOrientationValidator(bitmap, imagePath);

            mBitmap = Bitmap.createScaledBitmap(mBitmap, Integer.parseInt(width),
                    Integer.parseInt(height), true);

            int paddingTop = 130;

            if(!info.equalsIgnoreCase(""))
            {
            JSONArray mJsonArray = new JSONArray(info);
            int lenghtsize = mJsonArray.length() * 30;
            paddingTop = paddingTop + lenghtsize + 20;
            }
            mBitmap = addPaddingTopForBitmap(mBitmap, paddingTop);

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

            @SuppressLint("SimpleDateFormat") SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            String dateTime = sdf.format(Calendar.getInstance().getTime());

                picdevicelat = lat_str;
                picdevicelng = long_str;


            int textsize = 22;
            float textsize1 = 20f;
            float textsize2 = 20f;
            float textsize3 = 55f;
            float textsize4 = 85f;
            float textsize5 = 100f;


            Canvas cs = new Canvas(mBitmap);
            Paint tPaint = new Paint();
            Paint tPaint1 = new Paint();
            tPaint.setTextSize(textsize);
            tPaint.setColor(Color.BLACK);
            tPaint1.setColor(Color.WHITE);
            tPaint1.setAlpha(80);
            float height1 = tPaint.measureText("yY");
            tPaint.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
            tPaint.setStyle(Paint.Style.FILL_AND_STROKE);
            tPaint.setAntiAlias(true);
            tPaint.setTextScaleX(1f);

            String picDeviceLatLong = picdevicelat + " - " + picdevicelng;

            cs.drawText(dateTime, textsize1, height1 + textsize2, tPaint);
            cs.drawText(picDeviceLatLong, textsize1, height1 + textsize3, tPaint);
            cs.drawText("Username: " + username, textsize1, height1 + textsize4, tPaint);
            // info array set
            if (!info.equalsIgnoreCase("")) {
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
                        textsize5 = textsize5 + 30;
                        textView1.setTextSize(12);
                        cs.drawText(textView1.getText().toString(), textsize1, height1 + textsize5, tPaint);
                        linearLayout.addView(textView1);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            mBitmap.compress(Bitmap.CompressFormat.JPEG, 100, bytes);
            File f = new File(createNewDirectory("Easyform photos"), "EditImage_" + System.currentTimeMillis() + ".jpeg");
            f.createNewFile();
            FileOutputStream fo = new FileOutputStream(f);
            fo.write(bytes.toByteArray());
            fo.close();
            path = f.getAbsolutePath();
            return imageOrientationValidator(mBitmap, path);
        }
        else {
            return imageOrientationValidator(bitmap, imagePath);
        }
    }


    public String createNewDirectory(String name) {
        // create a directory before creating a new file inside it.
        File directory = new File(Environment.getExternalStorageDirectory(), name);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        return directory.getAbsolutePath();
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

    public Bitmap addPaddingTopForBitmap(Bitmap bitmap, int paddingTop) {
        Bitmap outputBitmap = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight() + paddingTop, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(outputBitmap);
        canvas.drawColor(Color.WHITE);
        canvas.drawBitmap(bitmap, 0, paddingTop, null);
        return outputBitmap;
    }

    private Bitmap imageOrientationValidator(Bitmap bitmap, String path) {
        Bitmap mBitmap = null;

        ExifInterface ei;
        try {
            ei = new ExifInterface(path);
            int orientation = ei.getAttributeInt(ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_UNDEFINED);
            switch (orientation) {
                case ExifInterface.ORIENTATION_ROTATE_90:
                    mBitmap = rotateImage(bitmap, 90);
                    break;
                case ExifInterface.ORIENTATION_ROTATE_180:
                    mBitmap = rotateImage(bitmap, 180);
                    break;
                case ExifInterface.ORIENTATION_ROTATE_270:
                    mBitmap = rotateImage(bitmap, 270);
                    break;
                default:
                    mBitmap = bitmap;
                    break;
            }
        } catch (IOException e) {
            mBitmap = bitmap;
        }
        return mBitmap;
    }

    public static Bitmap rotateImage(Bitmap source, float angle) {
        Bitmap retVal;
        try {
            Matrix matrix = new Matrix();
            matrix.postRotate(angle);
            retVal = Bitmap.createBitmap(source, 0, 0, source.getWidth(),
                    source.getHeight(), matrix, true);
        } catch (Exception e) {
            retVal = source;
        }
        return retVal;
    }

    public String changeFileName(String path) {


        Cursor c3 = database.rawQuery(
                "SELECT imei FROM Login_Master",
                null);
        c3.moveToLast();
        String imei = c3.getString(0);
        c3.close();


        final String timeStamp = new SimpleDateFormat("yyyyMMdd", Locale.US).format(new Date());
        String newPath = new File(path).getParent();
        String milli = String.valueOf(System.currentTimeMillis());
        String f_name = path.substring(
                path.lastIndexOf("/") + 1, path.indexOf("."));

        String extension = path.substring(path.lastIndexOf("."));

        File file = new File(path);
        File file2 = new File(newPath + "/DOC_" + timeStamp + "_" + milli + "_" + imei + "-" + f_name + extension);

        String changePath = String.valueOf(file2.getAbsoluteFile());
        boolean success = file.renameTo(file2);

        String filename = changePath.substring(changePath.lastIndexOf("/") + 1);
        pdftext.setVisibility(View.VISIBLE);
        pdftext.setText(filename);

        return changePath;
    }

    void alert(String message) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        //Uncomment the below code to Set the message and title from the strings.xml file
        //builder.setMessage(R.string.dialog_message) .setTitle(R.string.dialog_title);

        //Setting message manually and performing action on button click
        builder.setMessage(message)
                .setCancelable(false)
                .setPositiveButton("Ok", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        Bundle b = new Bundle();

                        Intent intent = new Intent();
                        intent.putExtras(b);
                        setResult(RESULT_CANCELED, intent);

                        finish();

                    }

                });


        //Creating dialog box
        AlertDialog alert = builder.create();
        //Setting the title manually
        alert.setTitle("File:");
        alert.show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        //check device time auto or manual and stop user if it is manual
        String checkDeviceTime = sqlitewraper.context.getResources().getString(R.string.RestrictDeviceTime);
        if(checkDeviceTime.equalsIgnoreCase("true"))
        {
            checkDeviceTime();
        }
    }

    //check device time auto or manual
    public void  checkDeviceTime() {
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


    private boolean checkPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            return false;
        }
        return true;
    }

    private void requestPermission() {

        ActivityCompat.requestPermissions(upload_large_file.this,
                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE},
                PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        switch (requestCode) {
            case PERMISSION_REQUEST_CODE:
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                        && grantResults[1] == PackageManager.PERMISSION_GRANTED) {
                    // Toast.makeText(getApplicationContext(), "Permission Granted", Toast.LENGTH_SHORT).show();

                    // main logic
                } else {
                    // Toast.makeText(getApplicationContext(), "Permission Denied", Toast.LENGTH_SHORT).show();
                    if ( ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

                        showMessageOKCancel("You need to allow access file and media permissions",
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
        new AlertDialog.Builder(upload_large_file.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }

}