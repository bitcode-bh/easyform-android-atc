package com.sky.atc.easyformse;

import android.content.SharedPreferences;
import android.os.StrictMode;


import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.mime.content.ByteArrayBody;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.client.DefaultHttpClient;

import java.io.ByteArrayOutputStream;
import java.io.File;

import java.io.FileInputStream;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.io.Reader;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.net.HttpURLConnection;

import javax.net.ssl.HttpsURLConnection;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static android.content.Context.MODE_PRIVATE;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
//to upload database to server

@StringFogIgnore
public class UploadDatabase {

    static int bufferSize;
    static int track_offset = 0;
    static double track_bytes;
    static int track_chnumber;
   static int offset = 0;
   static private SQLiteDatabase database;

//    public static int sendFileToServer1(String path, String targetUrl,
//                                        String file_name,String userid, String companyID,String extn,float size) throws IOException {
//        database = sqlitewraper.getDatabase();
//
//
//        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
//
//        StrictMode.setThreadPolicy(policy);
//        HttpClient httpclient = new DefaultHttpClient();
//
//        final int ret_err = 0;
//        try {
//
//            double totalbytes;
//            int final_total_ch;
//            HttpPost httppost = new HttpPost(targetUrl);
//
//            File f = new File(path);
//            if (f.exists()) {
//                System.out.print("dsds");
//            }else {
//                return 1;
//            }
//
//            double f_legnth = f.length();
//            int in_buffer_legnth = 1024 * 1024;
//            double total_chunk = f_legnth / in_buffer_legnth;
//            int total_ch = (int) f_legnth / in_buffer_legnth;
//            totalbytes = f_legnth;
//            if (total_chunk - total_ch > 0) {
//                final_total_ch = total_ch + 1;
//            } else {
//                final_total_ch = total_ch;
//            }
//
//            FileBody bin = new FileBody(f);
//
//            FileBody cbFile = new FileBody(f, "application/" + extn + "");
//            cbFile.getMediaType();
//            StringBody comment = new StringBody("A binary file of some kind");
//
//            for(int i=0; i < final_total_ch;i++) {
//
//
//                MultipartEntity reqEntity = new MultipartEntity();
//                reqEntity.addPart("flowChunkNumber",
//                        new StringBody(String.valueOf(i + 1)));
//                reqEntity.addPart("flowChunkSize",
//                        new StringBody(String.valueOf(1024 * 1024)));
//                reqEntity.addPart("flowCurrentChunkSize",
//                        new StringBody(String.valueOf(1024 * 1024)));
//                reqEntity.addPart("flowTotalSize",
//                        new StringBody(String.valueOf(f_legnth)));
//                reqEntity.addPart("flowIdentifier",
//                        new StringBody(String.valueOf(file_name)));
//                reqEntity.addPart("flowFilename",
//                        new StringBody(String.valueOf(file_name)));
//                reqEntity.addPart("flowRelativePath",
//                        new StringBody(String.valueOf(file_name)));
//                reqEntity.addPart("flowTotalChunks",
//                        new StringBody(String.valueOf(final_total_ch)));
//                reqEntity.addPart("CompanyId",
//                        new StringBody(companyID));
//                reqEntity.addPart("UserId",
//                        new StringBody(userid));
//                reqEntity.addPart("size",
//                        new StringBody(String.valueOf(size)));
//                reqEntity.addPart("step_No",
//                        new StringBody("0"));
//                reqEntity.addPart("type",
//                        new StringBody("db"));
//                reqEntity.addPart("Ph_id",
//                        new StringBody("0"));
//                reqEntity.addPart("it_id",
//                        new StringBody("0"));
//                reqEntity.addPart("th_path",
//                        new StringBody(path));
//                reqEntity.addPart("sid",
//                        new StringBody("0"));
//
//
//                ByteArrayOutputStream bos = new ByteArrayOutputStream();
//                byte[] data = bos.toByteArray();
//
//                System.out.println("executing request "
//                        + httppost.getRequestLine());
//
//                Writer writer = new StringWriter();
//
//                Reader reader;
//                try {
//
//                    FileInputStream fileInputStream = new FileInputStream(
//                            new File(path));
//
//                    StringBuffer fileContent = new StringBuffer("");
//                    // bufferSize = 1024 * 1024;
//                    if (totalbytes > (1024 * 1024)) {
//                        bufferSize = 1024 * 1024;
//                        totalbytes = totalbytes - bufferSize;
//
//                    } else {
//                        bufferSize = (int) totalbytes;
//                    }
//
//                    byte[] buffer = new byte[bufferSize];
//
//                    int intial_value = 1024 * 1024;
//
//                    int n = fileInputStream.read(buffer);
//
//                    if (i == 0) {
//
//                        fileContent.append(new String(buffer, 0, n));
//                        offset = +n;
//
//                    } else if (i + 1 != final_total_ch) {
//                        try {
//
//                            RandomAccessFile raf = new RandomAccessFile(f,
//                                    "r");
//                            raf.seek(offset);
//                            raf.readFully(buffer);
//                            fileContent.append(new String(buffer));
//                            offset = offset + (1024 * 1024);
//
//                        } catch (Exception e) {
//
//                            throw e;
//
//                        }
//
//                    } else if ((i + 1) == final_total_ch) {
//                        RandomAccessFile raf = new RandomAccessFile(f, "r");
//                        raf.seek(offset);
//                        raf.readFully(buffer);
//                        fileContent.append(new String(buffer));
//                    }
//
//                    ByteArrayBody imageByte = new ByteArrayBody(buffer,
//                            file_name);
//                    reqEntity.addPart("FileData", imageByte);
//                   {
//                        httppost.setEntity(reqEntity);
//                        HttpResponse response = httpclient.execute(httppost);
//                        if (response.getStatusLine().getStatusCode() == HttpsURLConnection.HTTP_OK) {
//                            System.out.print("dsd");
//
//                        } else {
//                            return 1;
//                        }
//
//                       HttpEntity resEntity = response.getEntity();
//                        track_chnumber = i;
//                        track_offset = offset;
//
//                        track_bytes = totalbytes;
//                    }
//
//                } // TODO: handle exception
//                catch (Exception e) {
//
//                    throw e;
//                    // TODO Auto-generated catch block
//
//                }
//
//            }
//        } catch (Exception e) {
//            throw e;
//        }
//        return ret_err;
//
//    }


    public static int sendFileToServer1(String path, String targetUrl,
                                        String file_name, String userid, String companyID, String extn, float size) throws IOException {

        database = sqlitewraper.getDatabase();

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        OkHttpClient client = NewWebservicesCallEasyform.getOkHttpClient();

        final int ret_err = 0;

        try {

            double totalbytes;
            int final_total_ch;

            File f = new File(path);
            if (!f.exists()) {
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

            for (int i = 0; i < final_total_ch; i++) {

                MultipartBody.Builder builder = new MultipartBody.Builder()
                        .setType(MultipartBody.FORM);

                builder.addFormDataPart("flowChunkNumber", String.valueOf(i + 1));
                builder.addFormDataPart("flowChunkSize", String.valueOf(1024 * 1024));
                builder.addFormDataPart("flowCurrentChunkSize", String.valueOf(1024 * 1024));
                builder.addFormDataPart("flowTotalSize", String.valueOf(f_legnth));
                builder.addFormDataPart("flowIdentifier", file_name);
                builder.addFormDataPart("flowFilename", file_name);
                builder.addFormDataPart("flowRelativePath", file_name);
                builder.addFormDataPart("flowTotalChunks", String.valueOf(final_total_ch));
                builder.addFormDataPart("CompanyId", companyID);
                builder.addFormDataPart("UserId", userid);
                builder.addFormDataPart("size", String.valueOf(size));
                builder.addFormDataPart("step_No", "0");
                builder.addFormDataPart("type", "db");
                builder.addFormDataPart("Ph_id", "0");
                builder.addFormDataPart("it_id", "0");
                builder.addFormDataPart("th_path", path);
                builder.addFormDataPart("sid", "0");

                FileInputStream fileInputStream = new FileInputStream(new File(path));

                if (totalbytes > (1024 * 1024)) {
                    bufferSize = 1024 * 1024;
                    totalbytes = totalbytes - bufferSize;
                } else {
                    bufferSize = (int) totalbytes;
                }

                byte[] buffer = new byte[bufferSize];

                int n = fileInputStream.read(buffer);

                if (i == 0) {
                    offset = +n;
                } else if (i + 1 != final_total_ch) {
                    RandomAccessFile raf = new RandomAccessFile(f, "r");
                    raf.seek(offset);
                    raf.readFully(buffer);
                    offset = offset + (1024 * 1024);
                    raf.close();
                } else if ((i + 1) == final_total_ch) {
                    RandomAccessFile raf = new RandomAccessFile(f, "r");
                    raf.seek(offset);
                    raf.readFully(buffer);
                    raf.close();
                }

                RequestBody fileBody = RequestBody.create(
                        buffer,
                        MediaType.parse("application/" + extn)
                );

                builder.addFormDataPart("FileData", file_name, fileBody);

                Request request = new Request.Builder()
                        .url(targetUrl)
                        .post(builder.build())
                        .build();

                try (Response response = client.newCall(request).execute()) {

                    if (response.code() == HttpURLConnection.HTTP_OK) {

                        track_chnumber = i;
                        track_offset = offset;
                        track_bytes = totalbytes;

                    } else {
                        return 1;
                    }
                }

                fileInputStream.close();
            }

        } catch (Exception e) {
            throw e;
        }

        return ret_err;
    }

}
