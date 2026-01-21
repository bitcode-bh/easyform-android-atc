package com.sky.atc.easyformse.upload;
import com.sky.atc.easyformse.BuildConfig;
import static com.sky.atc.easyformse.DeviceEventsUtils.VideoSizeConverter;
import static com.sky.atc.easyformse.sqlitewraper.context;

import android.content.ContentValues;
import android.content.SharedPreferences;
import android.content.res.Resources;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.provider.MediaStore;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.RequiresApi;

import com.sky.atc.easyformse.B_new;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.NewWebservicesCallEasyform;
import com.sky.atc.easyformse.PeerCertificateExtractor;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;
import com.sky.atc.easyformse.utils.Utils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ConnectTimeoutException;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.ByteArrayBody;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.params.CoreConnectionPNames;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.io.StringWriter;
import java.io.Writer;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import javax.net.ssl.HttpsURLConnection;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import okhttp3.CertificatePinner;
import okhttp3.Connection;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

@StringFogIgnore
public class UploadUtils {


    private static int track_offset = 0;
    private static int offset = 0;
    private static double track_bytes;
    private static int bufferSize;
    private static int track_chnumber;
    private static int ch_number = 0;
    private static double track_byte_g;
    public static String sizeofFile = "0";

    private static int tidcnt;
    private static int tidcntlog;
    private static JSONArray logjsonArray = new JSONArray();
    private static ArrayList<String> logsteparray = new ArrayList<>();
    private static int islogdel;
    private static OkHttpClient.Builder builder;
    private static SharedPreferences sharedPreferences= sqlitewraper.context.getSharedPreferences("LogWrite",0);


    //compress the image
    public static String compressImage(String imageUri) {

        String filePath = getRealPathFromURI(imageUri);
        Bitmap scaledBitmap = null;

        BitmapFactory.Options options = new BitmapFactory.Options();

//      by setting this field as true, the actual bitmap pixels are not loaded in the memory. Just the bounds are loaded. If
//      you try the use the bitmap here, you will get null.
        options.inJustDecodeBounds = true;
        Bitmap bmp = BitmapFactory.decodeFile(filePath, options);

        int actualHeight = options.outHeight;
        int actualWidth = options.outWidth;

//      max Height and width values of the compressed image is taken as 816x612

        float maxHeight = 916.0f;
        float maxWidth = 712.0f;
        float imgRatio = actualWidth / actualHeight;
        float maxRatio = maxWidth / maxHeight;

//      width and height values are set maintaining the aspect ratio of the image

        if (actualHeight > maxHeight || actualWidth > maxWidth) {
            if (imgRatio < maxRatio) {
                imgRatio = maxHeight / actualHeight;
                actualWidth = (int) (imgRatio * actualWidth);
                actualHeight = (int) maxHeight;
            } else if (imgRatio > maxRatio) {
                imgRatio = maxWidth / actualWidth;
                actualHeight = (int) (imgRatio * actualHeight);
                actualWidth = (int) maxWidth;
            } else {
                actualHeight = (int) maxHeight;
                actualWidth = (int) maxWidth;

            }
        }

//      setting inSampleSize value allows to load a scaled down version of the original image

        options.inSampleSize = calculateInSampleSize(options, actualWidth, actualHeight);

//      inJustDecodeBounds set to false to load the actual bitmap
        options.inJustDecodeBounds = false;

//      this options allow android to claim the bitmap memory if it runs low on memory
        options.inPurgeable = true;
        options.inInputShareable = true;
        options.inTempStorage = new byte[16 * 1024];

        try {
//          load the bitmap from its path
            bmp = BitmapFactory.decodeFile(filePath, options);
        } catch (OutOfMemoryError exception) {
            exception.printStackTrace();

        }
        try {
            scaledBitmap = Bitmap.createBitmap(actualWidth, actualHeight, Bitmap.Config.ARGB_8888);
        } catch (OutOfMemoryError exception) {
            exception.printStackTrace();
        }

        float ratioX = actualWidth / (float) options.outWidth;
        float ratioY = actualHeight / (float) options.outHeight;
        float middleX = actualWidth / 2.0f;
        float middleY = actualHeight / 2.0f;

        Matrix scaleMatrix = new Matrix();
        scaleMatrix.setScale(ratioX, ratioY, middleX, middleY);

        Canvas canvas = new Canvas(scaledBitmap);
        canvas.setMatrix(scaleMatrix);
        canvas.drawBitmap(bmp, middleX - bmp.getWidth() / 2, middleY - bmp.getHeight() / 2, new Paint(Paint.FILTER_BITMAP_FLAG));

//      check the rotation of the image and display it properly
        ExifInterface exif;
        try {
            exif = new ExifInterface(filePath);

            int orientation = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION, 0);
            Log.d("EXIF", "Exif: " + orientation);
            Matrix matrix = new Matrix();
            if (orientation == 6) {
                matrix.postRotate(90);
                Log.d("EXIF", "Exif: " + orientation);
            } else if (orientation == 3) {
                matrix.postRotate(180);
                Log.d("EXIF", "Exif: " + orientation);
            } else if (orientation == 8) {
                matrix.postRotate(270);
                Log.d("EXIF", "Exif: " + orientation);
            }
            scaledBitmap = Bitmap.createBitmap(scaledBitmap, 0, 0,
                    scaledBitmap.getWidth(), scaledBitmap.getHeight(), matrix,
                    true);
        } catch (IOException e) {
            e.printStackTrace();
        }

        FileOutputStream out = null;
        String filename = getFilename();
        try {
            out = new FileOutputStream(filename);

//          write the compressed bitmap at the destination specified by filename.
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, 90, out);

        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }

        return filename;

    }

    public static String getFilename() {
        File file = new File(Environment.getExternalStorageDirectory().getPath(), "Easy_form/Selected");
        if (!file.exists()) {
            file.mkdirs();
        }
        String uriSting = (file.getAbsolutePath() + "/" + System.currentTimeMillis() + ".jpg");
        return uriSting;

    }

    private static String getRealPathFromURI(String contentURI) {
        Uri contentUri = Uri.parse(contentURI);
        Cursor cursor = sqlitewraper.context.getContentResolver().query(contentUri, null, null, null, null);
        if (cursor == null) {
            return contentUri.getPath();
        } else {
            cursor.moveToFirst();
            int index = cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATA);
            return cursor.getString(index);
        }
    }

    public static int calculateInSampleSize(BitmapFactory.Options options, int reqWidth, int reqHeight) {
        final int height = options.outHeight;
        final int width = options.outWidth;
        int inSampleSize = 1;

        if (height > reqHeight || width > reqWidth) {
            final int heightRatio = Math.round((float) height / (float) reqHeight);
            final int widthRatio = Math.round((float) width / (float) reqWidth);
            inSampleSize = heightRatio < widthRatio ? heightRatio : widthRatio;
        }
        final float totalPixels = width * height;
        final float totalReqPixelsCap = reqWidth * reqHeight * 2;
        while (totalPixels / (inSampleSize * inSampleSize) > totalReqPixelsCap) {
            inSampleSize++;
        }

        return inSampleSize;
    }


    //upload photo using resumable
    public static int uploadPhotoResumable(String path, String CompanyId, String CustomerUniq, String checksheetid_new, String que_id, String step_No, String type, String Ph_id, String it_id, String th_path, String sid) throws IOException {

//        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
//        StrictMode.setThreadPolicy(policy);

        ch_number = 0;

        String name_file = changeFileName(path);
        String l_name = path.substring(path.lastIndexOf("."));
        name_file = name_file + l_name;
        String ext = l_name.substring(l_name.lastIndexOf(".") + 1);
        type = ext;

        HttpClient httpclient = new DefaultHttpClient();
        //txt file upload issue so change video url to use resumbale url 05-03-2024
        String appURL;
        String targetUrl;
        appURL = sqlitewraper.context.getResources().getString(R.string.App_URL).split("/")[2].trim();
        if(appURL.equalsIgnoreCase("login.easyform.in"))
        {
            // for login url
             targetUrl = context.getResources().getString(R.string.Resumable_URL) + "flowupload";
        }
        else {
            // for other url
             targetUrl = context.getResources().getString(R.string.Video_URL) + "api/flowupload";
        }

        int photoID = 0;
        double totalbytes;
        int final_total_ch;
        HttpPost httppost = new HttpPost(targetUrl);

        File f = new File(path);
        if (f.exists()) {
            System.out.print("dsds");
        } else {
            return 1;
        }

        double f_legnth = f.length();
        int in_buffer_legnth = 1024 * 1024;
        double total_chunk = f_legnth / in_buffer_legnth;
        int total_ch = (int) f_legnth / in_buffer_legnth;
        totalbytes = f_legnth;
        if (total_chunk - total_ch > 0) {
            final_total_ch = total_ch + 1;
        } else {
            final_total_ch = total_ch;
        }

        if (track_byte_g > 0) {
            totalbytes = track_byte_g;
        }


        String size = getFileSize((long) f_legnth);

        sizeofFile = size;

        FileBody bin = new FileBody(f);

        FileBody cbFile = new FileBody(f, "application/" + ext + "");
        cbFile.getMediaType();
        StringBody comment = new StringBody("A binary file of some kind");

        for (int i = 0; i < final_total_ch; i++) {

            Log.d("##ACHUNNK_NUMBER", "CH:" + i + "FINAL:" + final_total_ch);

            if (CustomerUniq.equals("null") || CustomerUniq == null) {
                CustomerUniq = "0";
            }

            String sizekb = VideoSizeConverter(size);

            MultipartEntity reqEntity = new MultipartEntity();
            reqEntity.addPart("flowChunkNumber",
                    new StringBody(String.valueOf(i + 1)));
            reqEntity.addPart("flowChunkSize",
                    new StringBody(String.valueOf(1024 * 1024)));
            reqEntity.addPart("flowCurrentChunkSize",
                    new StringBody(String.valueOf(1024 * 1024)));
            reqEntity.addPart("flowTotalSize",
                    new StringBody(String.valueOf(Math.round(f_legnth))));
            reqEntity.addPart("flowIdentifier",
                    new StringBody(String.valueOf(name_file)));
            reqEntity.addPart("flowFilename",
                    new StringBody(String.valueOf(name_file)));
            reqEntity.addPart("flowRelativePath",
                    new StringBody(String.valueOf(name_file)));
            reqEntity.addPart("flowTotalChunks",
                    new StringBody(String.valueOf(final_total_ch)));
            reqEntity.addPart("CompanyId",
                    new StringBody(CompanyId));
            reqEntity.addPart("CustomerUniq",
                    new StringBody(CustomerUniq));

            reqEntity.addPart("checksheetid",
                    new StringBody(String.valueOf(checksheetid_new)));
            reqEntity.addPart("que_id",
                    new StringBody(String.valueOf(que_id)));
            reqEntity.addPart("appid",
                    new StringBody(String.valueOf(DeviceEventsUtils.getLoginDetails().get(2))));


            if (step_No == null) {
                step_No = "0";
            }
            reqEntity.addPart("step_No",
                    new StringBody(step_No));
            reqEntity.addPart("type",
                    new StringBody(type));
            reqEntity.addPart("Ph_id",
                    new StringBody(Ph_id));
            reqEntity.addPart("it_id",
                    new StringBody(it_id));
            reqEntity.addPart("size",
                    new StringBody("0"));
            reqEntity.addPart("size_kb",
                    new StringBody(sizekb));
            reqEntity.addPart("th_path",
                    new StringBody(th_path));
            reqEntity.addPart("sid",
                    new StringBody(String.valueOf(sid)));


            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] data = bos.toByteArray();

            System.out.println("executing request "
                    + httppost.getRequestLine());

            Writer writer = new StringWriter();

            FileInputStream fileInputStream = new FileInputStream(
                    new File(path));

            StringBuffer fileContent = new StringBuffer("");
            // bufferSize = 1024 * 1024;
            if (totalbytes > (1024 * 1024)) {
                bufferSize = 1024 * 1024;
                totalbytes = totalbytes - bufferSize;

            } else {
                bufferSize = (int) totalbytes;
            }

            byte[] buffer = new byte[bufferSize];

            int n = fileInputStream.read(buffer);

            if (i == 0) {

                fileContent.append(new String(buffer, 0, n));
                offset = +n;

            } else if (i + 1 != final_total_ch) {
                try {

                    RandomAccessFile raf = new RandomAccessFile(f,
                            "r");
                    raf.seek(offset);
                    raf.readFully(buffer);
                    fileContent.append(new String(buffer));
                    offset = offset + (1024 * 1024);

                } catch (Exception e) {
                    throw e;

                }

            } else if ((i + 1) == final_total_ch) {
                RandomAccessFile raf = new RandomAccessFile(f, "r");
                raf.seek(offset);
                raf.readFully(buffer);
                fileContent.append(new String(buffer));
            }
            ByteArrayBody imageByte = new ByteArrayBody(buffer, name_file);
            reqEntity.addPart("file", imageByte);

            B_new b = new B_new();
            String u_c1 = b.GetValue();

            if (!u_c1.equalsIgnoreCase("NA")) {

                httppost.setEntity(reqEntity);
                try {
                    boolean mStringLogWrite = sharedPreferences.getBoolean("isLogWrite",false);
                    if (mStringLogWrite)
                        reqEntity.writeTo(new FileOutputStream(Utils.getRootFolderFile(sqlitewraper.context) + "/" + LogUtils.LogFolderName + "/" + "output.txt"));
                } catch (Exception e) {
                    e.printStackTrace();
                }
               // HttpConnectionParams.setSoTimeout((HttpParams) reqEntity, 6000);

                HttpResponse response = httpclient.execute(httppost);


                if (response.getStatusLine().getStatusCode() == HttpsURLConnection.HTTP_OK) {
                    System.out.print("dsd");
                    String responseString = new BasicResponseHandler().handleResponse(response);
                    Log.d("##AA", responseString);

                    try {
                        JSONArray jsonArray = new JSONArray(responseString);
                        JSONObject jsonObject = jsonArray.getJSONObject(0);
                        photoID = Integer.parseInt(jsonObject.getString("Photo_id"));


                    } catch (JSONException e) {
                        LogUtils.writeApiCallLogToFile( reqEntity +  "\n response parse: " + responseString + e, targetUrl,"","1");
                        e.printStackTrace();
                    }


                } else {
                    new Handler(Looper.getMainLooper()).post(new Runnable() {
                        public void run() {
                            Toast.makeText(context, "Photo upload process \nResponse code: " +  response.getStatusLine().getStatusCode() +"\nUrl: "+targetUrl, Toast.LENGTH_LONG).show();
                        }
                    });
                    LogUtils.writeApiCallLogToFile( reqEntity +  "\n response code: " + response.getStatusLine().getStatusCode() , targetUrl,"","1");
                    return 0;
                }

                HttpEntity resEntity = response.getEntity();
                track_chnumber = i;
                track_offset = offset;

                track_bytes = totalbytes;
            } else {
                return 0;
            }

            System.out.println("Response content: " + writer.toString());
        }

        return photoID;
    }

    //upload photo using resumable
    public static int uploadPhotoNewResumable(String path, String CompanyId, String CustomerUniq, String checksheetid_new, String que_id, String step_No, String type, String Ph_id, String it_id, String th_path, String sid) throws IOException {
        final String targetUrl = context.getResources().getString(R.string.Video_URL) + "api/flowupload";
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        ch_number = 0;
        File currentFile = new File(path);

        String tempFileName = changeFileName(path);
        String fileExt = path.substring(path.lastIndexOf("."));
        tempFileName = tempFileName + fileExt;
        String extension = fileExt.substring(fileExt.lastIndexOf(".") + 1);
        type = extension;

        OkHttpClient okHttpClient = NewWebservicesCallEasyform.getOkHttpClient();

        int photoID = 0;
        double totalbytes;
        int final_total_ch;


        if (currentFile.exists()) {
            System.out.print("dsds");
        } else {
            return 1;
        }

        double f_legnth = currentFile.length();
        int in_buffer_legnth = 1024 * 1024;
        double total_chunk = f_legnth / in_buffer_legnth;
        int total_ch = (int) f_legnth / in_buffer_legnth;
        totalbytes = f_legnth;
        if (total_chunk - total_ch > 0) {
            final_total_ch = total_ch + 1;
        } else {
            final_total_ch = total_ch;
        }

        if (track_byte_g > 0) {
            totalbytes = track_byte_g;
        }


        String size = getFileSize((long) f_legnth);

        sizeofFile = size;

        FileBody bin = new FileBody(currentFile);

        FileBody cbFile = new FileBody(currentFile, "application/" + extension + "");
        cbFile.getMediaType();
        StringBody comment = new StringBody("A binary file of some kind");

        for (int i = 0; i < final_total_ch; i++) {

            Log.d("##ACHUNNK_NUMBER", "CH:" + i + "FINAL:" + final_total_ch);

            if (CustomerUniq.equals("null") || CustomerUniq == null) {
                CustomerUniq = "0";
            }


            String sizekb = VideoSizeConverter(size);

            MultipartBody.Builder multipartBody = new MultipartBody.Builder()
                    .addFormDataPart("flowChunkNumber",
                            String.valueOf(i + 1))
                    .addFormDataPart("flowChunkSize",
                            (String.valueOf(1024 * 1024)))
                    .addFormDataPart("flowCurrentChunkSize",
                            (String.valueOf(1024 * 1024)))
                    .addFormDataPart("flowTotalSize",
                            (size))
                    .addFormDataPart("flowIdentifier",
                            (tempFileName))
                    .addFormDataPart("flowFilename",
                            (tempFileName))
                    .addFormDataPart("flowRelativePath",
                            (tempFileName))
                    .addFormDataPart("flowTotalChunks",
                            (String.valueOf(final_total_ch)))
                    .addFormDataPart("CompanyId",
                            (CompanyId))
                    .addFormDataPart("CustomerUniq",
                            (CustomerUniq))
                    .addFormDataPart("checksheetid",
                            (String.valueOf(checksheetid_new)))
                    .addFormDataPart("que_id",
                            (String.valueOf(que_id)))
                    .addFormDataPart("appid",
                            (String.valueOf(DeviceEventsUtils.getLoginDetails().get(2))))
                    .addFormDataPart("type",
                            (type))
                    .addFormDataPart("Ph_id",
                            (Ph_id))
                    .addFormDataPart("it_id",
                            (it_id))
                    .addFormDataPart("size",
                            ("0"))
                    .addFormDataPart("size_kb",
                            (sizekb))
                    .addFormDataPart("th_path",
                            (th_path))
                    .addFormDataPart("sid",
                            (String.valueOf(sid)));
            if (step_No == null) {
                step_No = "0";
            }
            multipartBody.addFormDataPart("step_No",
                    (step_No));

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            Writer writer = new StringWriter();

            FileInputStream fileInputStream = new FileInputStream(
                    path);

            StringBuffer fileContent = new StringBuffer("");
            // bufferSize = 1024 * 1024;
            if (totalbytes > (1024 * 1024)) {
                bufferSize = 1024 * 1024;
                totalbytes = totalbytes - bufferSize;

            } else {
                bufferSize = (int) totalbytes;
            }

            byte[] buffer = new byte[bufferSize];

            int n = fileInputStream.read(buffer);

            if (i == 0) {

                fileContent.append(new String(buffer, 0, n));
                offset = +n;

            } else if (i + 1 != final_total_ch) {
                try {

                    RandomAccessFile raf = new RandomAccessFile(currentFile,
                            "r");
                    raf.seek(offset);
                    raf.readFully(buffer);
                    fileContent.append(new String(buffer));
                    offset = offset + (1024 * 1024);

                } catch (Exception e) {
                    throw e;

                }

            } else if ((i + 1) == final_total_ch) {
                RandomAccessFile raf = new RandomAccessFile(currentFile, "r");
                raf.seek(offset);
                raf.readFully(buffer);
                fileContent.append(new String(buffer));
            }
            multipartBody.addFormDataPart("FileData", tempFileName, RequestBody.create(MediaType.parse(cbFile.getMediaType()), buffer));


            B_new b = new B_new();
            String u_c1 = b.GetValue();

            if (!u_c1.equalsIgnoreCase("NA")) {


                Request resumableRequest = new Request.Builder()
                        .url(targetUrl)
                        .post(multipartBody.build())
                        .build();
                Response response = okHttpClient.newCall(resumableRequest).execute();


                if (response.code() == 200) {
                    System.out.print("dsd");
                    String responseString = response.body().string();
                    Log.d("##AA", responseString);

                    try {
                        JSONArray jsonArray = new JSONArray(responseString);
                        JSONObject jsonObject = jsonArray.getJSONObject(0);
                        photoID = Integer.parseInt(jsonObject.getString("Photo_id"));


                    } catch (JSONException e) {
                        e.printStackTrace();
                    }


                } else {
                    return 0;
                }


                track_chnumber = i;
                track_offset = offset;

                track_bytes = totalbytes;
            } else {
                return 0;
            }

            System.out.println("Response content: " + writer.toString());
        }

        return photoID;
    }


    private static String changeFileName(String path) {

        SQLiteDatabase database = sqlitewraper.getDatabase();

        String changePath = "NA";
        try {

            Cursor c3 = null;
            if (database != null) {
                c3 = database.rawQuery(
                        "SELECT imei FROM Login_Master",
                        null);
                c3.moveToLast();
                String imei = c3.getString(0);
                c3.close();
                final String timeStamp = new SimpleDateFormat("yyyyMMdd", Locale.US).format(new Date());
                String milli = String.valueOf(System.currentTimeMillis());
                String f_name = path.substring(
                        path.lastIndexOf("/"));
                String p_name = f_name.substring(f_name.lastIndexOf("/") + 1, f_name.indexOf("."));
                changePath = "DOC_" + timeStamp + "_" + milli + "_" + imei + "-" + p_name;
            }
        } catch (Exception e) {
            Log.d("##ERRORDATA", e.toString());
            e.printStackTrace();
        }
        return changePath;
    }

    public static String getFileSize(long size) {
        if (size <= 0)
            return "0";

        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));

        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }

    //Invalid Log table Insert Logic
    public static void isValidLog(int tid, String responseText, String checksheetid, String step) {


        JSONArray jsonArray2;
        String type = "";
        String queID = "";
        String name = "";
        try {
            jsonArray2 = new JSONArray(responseText);
            JSONObject jsonObject = jsonArray2.getJSONObject(0);
            type = jsonObject.getString("type");
            queID = jsonObject.getString("que_id");
            name = jsonObject.getString("name");
        } catch (JSONException e) {
            LogUtils.writeUploadLogToFile("isValidLog: " + e, "","isValidLog");
        }

        SQLiteDatabase database = sqlitewraper.getDatabase();

        try {
            islogdel = 0;
            if (tidcntlog != tid) {
                tidcntlog = tid;
                logjsonArray = new JSONArray(new ArrayList<String>());
                logsteparray.clear();
            }

            JSONObject data1 = new JSONObject();

            Cursor c1 = database
                    .rawQuery(
                            "select c_name,c_type from checksheet where checksheetid='"
                                    + checksheetid + "' ", null);

            c1.moveToFirst();

            String c_name = c1.getString(0);
            String c_type = c1.getString(1);
            islogdel = 1;
            c1.close();

            Cursor c2 = database
                    .rawQuery(
                            "select subcategory from checksheet where checksheetid='"
                                    + checksheetid + "' and step='" + step + "' ", null);

            c2.moveToFirst();
            String chstep = c2.getString(0);
            c2.close();
            if (!logsteparray.contains(chstep)) {
                data1.put("c_name", c_name);
                data1.put("s_name", chstep);
                data1.put("type", type);
                data1.put("que_id", queID);
                data1.put("name", name);
                data1.put("checksheet_type", c_type);
                logjsonArray.put(data1);
                logsteparray.add(c_name);
                logsteparray.add(chstep);
            }

            ContentValues cv = new ContentValues();
            cv.put("is_valid_log", String.valueOf(logjsonArray));

            String t2 = "tid=" + tid;

            long temp = database.update(
                    "task_master", cv, t2, null);


            //Logic for Revert status

            //Take Second Last status
            Cursor c4 = database
                    .rawQuery("SELECT status FROM task_master_history WHERE tid='" + tid + "' ORDER BY tid_n desc LIMIT 1, 1", null);

            c4.moveToFirst();

            String status = "0";

            if (c4.getCount() > 0) {

                status = c4.getString(0);

            }

            //Incase second last status is not exist take last status
            else {

                Cursor c5 = database
                        .rawQuery("SELECT status FROM task_master_history WHERE tid='" + tid + "' ORDER BY tid_n desc LIMIT 0, 1", null);
                c5.moveToFirst();

                if (c5.getCount() > 0) {
                    status = c5.getString(0);
                }

                c5.close();
            }

            //Compare with task_master status
            String statustask = compareStatuswithTaskmaster(tid, database);

            if (statustask.equalsIgnoreCase(status)) {
                status = "0";
            }

            DeviceEventsUtils.insert_task_master_revert("is_valid_log", status, tid);

            ContentValues cv2 = new ContentValues();
            cv2.put("status", status);
//            cv2.put("flag", 3);
            String t3 = "tid='" + tid + "'";
            long temp2 = database.update(
                    "task_master", cv2, t3, null);

            //pa
            parentStatusUpdate(tid, database);

        } catch (Exception e) {
            LogUtils.writeUploadLogToFile("ValidLog: " + e.toString(), "","isValidLog");
        }
    }

    private static String compareStatuswithTaskmaster(int tid, SQLiteDatabase database) {

        Cursor check = database
                .rawQuery(
                        "select status from task_master where  tid='" + tid + "'", null);
        check.moveToFirst();
        String status = "";

        if (check.getCount() > 0) {
            status = check.getString(0);
        }

        check.close();
        return status;
    }

    private static void parentStatusUpdate(int tid, SQLiteDatabase database) {

        Cursor cstatus = database
                .rawQuery(
                        "select p_tid,moduleid,module_name from task_master where ((server_task_id !='0' and p_tid is not null)) and tid='"
                                + tid + "' ", null);
        cstatus.moveToFirst();
        int j = cstatus.getCount();

        if (j > 0) {

            int pid = cstatus.getInt(0);

            cstatus.close();

            Cursor cstatus1 = database
                    .rawQuery("SELECT status FROM task_master_history WHERE tid='" + pid + "' ORDER BY tid_n desc LIMIT 1, 1", null);

            cstatus1.moveToFirst();

            String status1 = "0";
            if (cstatus1.getCount() > 0) {
                status1 = cstatus1.getString(0);
            } else {

                Cursor c4 = database
                        .rawQuery("SELECT status FROM task_master_history WHERE tid='" + pid + "' ORDER BY tid_n desc LIMIT 0, 1", null);
                c4.moveToFirst();
                if (c4.getCount() > 0) {
                    status1 = c4.getString(0);
                }
                c4.close();
            }
            cstatus1.close();
            String statustask = compareStatuswithTaskmaster(pid, database);

            if (statustask.equalsIgnoreCase(status1)) {
                status1 = "0";
            }

            ContentValues cv2 = new ContentValues();
            cv2.put("status", status1);
            cv2.put("flag", 3);
            String t3 = "tid='" + pid + "'";
            long temp3 = database.update(
                    "task_master", cv2, t3, null);


        } else {

            ContentValues cv3 = new ContentValues();
            cv3.put("flag", 3);
            String t4 = "tid='" + tid + "'";
            long temp3 = database.update(
                    "task_master", cv3, t4, null);
        }
    }

}
