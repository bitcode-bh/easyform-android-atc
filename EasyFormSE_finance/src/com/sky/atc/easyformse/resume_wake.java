package com.sky.atc.easyformse;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.graphics.Bitmap;
import android.media.ThumbnailUtils;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Log;
import android.webkit.MimeTypeMap;
import android.widget.Toast;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import org.json.JSONArray;
import org.json.JSONObject;
import org.ksoap2.SoapEnvelope;
import org.ksoap2.serialization.PropertyInfo;
import org.ksoap2.serialization.SoapObject;
import org.ksoap2.serialization.SoapPrimitive;
import org.ksoap2.serialization.SoapSerializationEnvelope;
import org.ksoap2.transport.HttpTransportSE;

import java.io.File;
import java.io.FileOutputStream;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by Mikka on 12/14/2016.
 */

//download document file from link will call fro sql_class
@Obfuscate

public class resume_wake extends WakefulIntentService {

    SQLiteDatabase database;
    private static final String NAMESPACE3 = "http://tempuri.org/";
    private static final String URL3 = sqlitewraper.context.getResources().getString(R.string.App_URL) + "/Services/File_Download.asmx?WSDL";
//    private static final String METHOD_NAME_corner3 = "Select_File_Details";
    private static final String SOAP_ACTION_site3 = "http://tempuri.org/Select_File_Details";
    private static final int TIMEOUT = 300000;
    String thumbnail_path = "NA";
	
	 //WCF URL
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);
    private static final String METHOD_NAME_corner3 = "WCF_Select_File_Details";


    int dl_progress;
    String path, th_path;
    int count = 0;
    boolean downloading = true;
    File folder;
    boolean check;

    String access_token = null;
    String expirydate = null;


    public resume_wake() {
        super("resume_wake");
    }

    public static String getMimeType(String url) {
        String type = null;
        String extension = MimeTypeMap.getFileExtensionFromUrl(url);
        if (extension != null) {
            type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        }
        return type;
    }

    @Override
    protected void doWakefulWork(Intent intent) {

        database = sqlitewraper.getDatabase();


        update_sid();
        get_link();
        resume_down();

    }


    void resume_down() {

        final Cursor c = database
                .rawQuery(
                        "select _id,download_url,upload_type,actual_name,p_name,or_path from download_video where isdown_track=2",
                        null);

        //
        // final Cursor c = database
        // .rawQuery(
        // "select _id,download_url from download_video",
        // null);
        c.moveToFirst();
        if (c.getCount() > 0) {
            for (int i = 0; i < c.getCount(); i++) {

                try {

                    final int id = c.getInt(0);
                    String download_url = c.getString(1);
                    String upload_type = c.getString(2);
                    String actual_name = c.getString(3);
                    String p_name = c.getString(4);
                    if(actual_name == null){
                        actual_name = "";
                    }


                    String extn = actual_name.substring(actual_name.lastIndexOf(".") + 1);
                    String path = c.getString(4);

                    String actual_namemime = actual_name.replaceAll(" ", "");
                    String mimeType = getMimeType(actual_namemime);
                    //String mimeType = getMimeType(actual_name);

                    if(upload_type == null){
                        upload_type = "easyform";
                    }

                    if (upload_type.equals("sharepoint")) {
//                        acc_token();
                    }

                    downloading = true;
                    String urlDownload = download_url;
                    String v_name = urlDownload.substring(urlDownload
                            .lastIndexOf("\\") + 1);

                    DownloadManager.Request request = new DownloadManager.Request(
                            Uri.parse(urlDownload));
                    request.setDescription("Document_download");
                    request.setTitle(actual_name);
                    request.allowScanningByMediaScanner();
                    if (upload_type.equals("sharepoint")) {
                        request.addRequestHeader("Authorization", "Bearer " + access_token);
                        request.addRequestHeader("Accept", "application/json;odata=verbose");
                    }


                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

                        folder = new File(Environment.getExternalStorageDirectory()
                                + File.separator + "Document_Easy");

                        folder.mkdirs();

                        path = folder.getAbsolutePath() + "/" + v_name;


                    File file = new File(path);
                    if (!file.exists()) {

                        Uri path_n = Uri.fromFile(new File(path));
                        request.setDestinationUri(path_n);
                    }
                    request.setMimeType(mimeType);
                    // request.setDestinationInExternalPublicDir(path, v_name);

                    final DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);

                    final long downloadId = manager.enqueue(request);
                    check = true;
                    while (downloading && check) {

                        down(id, download_url, downloadId, manager);

                    }

                    if (!downloading) {

                        String t = "_id =" + id;
                        ContentValues c_val = new ContentValues();
                        c_val.put("progress", dl_progress);
                        c_val.put("or_path", path);
                        c_val.put("con_path", thumbnail_path);
                        c_val.put("isdown_track", "3");
                        long temp = database.update("download_video", c_val, t,null);


                    }
                    c.moveToNext();
                    //

                } catch (Exception e) {
                    c.moveToNext();

                }
            }
        }
    }

    void down(int id, String download_url, long downloadId,
              DownloadManager manager) {

        DownloadManager.Query q = new DownloadManager.Query();
        q.setFilterById(downloadId);

        Cursor cursor = manager.query(q);
        cursor.moveToFirst();
        int bytes_downloaded = cursor
                .getInt(cursor
                        .getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
        int bytes_total = cursor.getInt(cursor
                .getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
        dl_progress = (int) ((bytes_downloaded * 100l) / bytes_total);
        if (cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_SUCCESSFUL) {

            downloading = false;

        } else if (cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_FAILED) {
            data d = new data();
            if (d.getDownloadid().equals(downloadId)) {
                manager.remove(downloadId);
                data d_new = new data();
                d_new.setDownloadid("NA");

            }
            check = false;

            String t = "_id =" + id;
            ContentValues c_val = new ContentValues();
            c_val.put("isdown_track", "4");
            long temp = database.update("download_video", c_val, t,null);

        } else {

            String t = "_id =" + id;
            ContentValues c_val = new ContentValues();
            c_val.put("progress", dl_progress);
            c_val.put("download_id", downloadId);
            long temp = database.update("download_video", c_val, t, null);

            data d = new data();
            if (d.getDownloadid().equals(downloadId)) {
                manager.remove(downloadId);
                data d_new = new data();
                d_new.setDownloadid("NA");

            }

        }
        count++;

        cursor.close();
    }

    void get_link() {

        Cursor c = database
                .rawQuery(
                        "select _id,con_path,tid,chunk_number,offset,totalbyte,CompanyId,CustomerUniq,que_id,checksheetid,Ph_id,it_id,millisecond,or_path,sid,upload_type,sharepoint_url from download_video where isdown_track=1 and sid !=0",
                        null);
        c.moveToFirst();
        if (c.getCount() > 0) {
            for (int i = 0; i < c.getCount(); i++) {
                try {
                    int id = c.getInt(0);
                    String th_path = c.getString(1);
                    int tid = c.getInt(2);
                    String chunk_number = c.getString(3);
                    String offset_g = c.getString(4);
                    String track_byte = c.getString(5);
                    String CompanyId = c.getString(6);
                    String CustomerUniq = c.getString(7);
                    int que_id = c.getInt(8);
                    int checksheetid_new = c.getInt(9);
                    String Ph_id = c.getString(10);
                    String it_id = c.getString(11);
                    String millisecond = c.getString(12);
                    String path = c.getString(13);
                    int sid = c.getInt(14);
                    String download_type = c.getString(15);
                    if(download_type == null){
                        download_type = "easyform";
                    }

                    JSONObject data1 = new JSONObject();
                    data1.put("Checksheet_Id", checksheetid_new);
                    // data1.put("Checksheet_Id", 2099);
                    data1.put("Type22_Inner_Qid", Ph_id);
                    data1.put("Type22_IndexNo", it_id);
                    data1.put("Company_id", CompanyId);
                    data1.put("CustomerUniq", CustomerUniq);
                    data1.put("th_path", th_path);
                    data1.put("UpdatedBy", 0);
                    data1.put("Ph_id", Ph_id);
                    data1.put("it_id", it_id);
                    data1.put("server_task_id", sid);
                    // data1.put("Task_Id", "345444");
                    data1.put("Que_Id", que_id);
                    // data1.put("Que_Id", 79);
                    data1.put("Millisecond", millisecond);
                    data1.put("download_type", download_type);

                    Cursor c3 = database
                            .rawQuery(
                                    "SELECT username,u_c ,company_id FROM Login_Master ",
                                    null);
                    c3.moveToFirst();
                    if (c3.getCount() > 0) {
                        String username1 = c3.getString(0);
                        String u_c = c3.getString(1);
                    }
                    JSONObject data2 = new JSONObject();
                    data2.put("username", "NA");
                    data2.put("u_c", "NA");
//                    SoapObject data = new SoapObject(NAMESPACE3,
//                            METHOD_NAME_corner3);
//                    String restext = webservice(data1, data2, data, URL3,
//                            SOAP_ACTION_site3, 0);

                    String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequestfile(data1, WCFURL, METHOD_NAME_corner3, data1);
                    JSONArray jsonArray = new JSONArray(restext);
                    JSONObject jsonObject = null;
                    String status1 = "NA";
                    String download_url = "NA";
                    for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                         jsonObject = jsonArray.getJSONObject(0);
                        status1 = jsonObject.getString("status");
                    }

                    if (status1.equalsIgnoreCase("1")) {

//                        parse data in json object 25/1 for download
                        String Data = jsonObject.getString("data");
                        JSONArray mJsonObject1 = new JSONArray(Data);
                        download_url = mJsonObject1.getJSONObject(0).getString("File_Url");

//                       old code
//                        download_url = jsonObject.getString("File_Url");
//                        thumbnail_path = jsonObject.getString("Thumbnail_Path");
                        String name = download_url.substring(download_url.lastIndexOf("-") + 1);
                        String extension = name.substring(name.lastIndexOf("."));

                        if(extension.equals(".mp4")){

                        }

                        Log.d("name",name);

                        String t;
                        t = "_id=" + id;
                        ContentValues t_i = new ContentValues();
                        t_i.put("download_url", download_url);
                        t_i.put("isdown_track", "2");
                        long task = database.update("download_video", t_i, t,
                                null);
                        c.moveToNext();
                    } else {



                        final String message = jsonObject.getString("message");
                        new Handler(Looper.getMainLooper()).post(new Runnable() {
                            public void run() {
                                Toast toast = Toast.makeText(resume_wake.this, message, Toast.LENGTH_SHORT);
                                toast.show();
                            }
                        });

                        String t = "_id =" + id;
                        ContentValues c_val = new ContentValues();
                        c_val.put("download_url", message);
                        c_val.put("isdown_track", "4");
                        long temp = database.update("download_video", c_val, t,null);

                        c.moveToNext();
                    }

                } catch (Exception e) {
                    c.moveToNext();

                }

            }

        }
    }

    void update_sid() {

        Cursor c = database
                .rawQuery(
                        "select _id,tid,parent_task_id  from download_video where isdown_track=0",
                        null);
        c.moveToFirst();
        if (c.getCount() > 0) {
            for (int i = 0; i < c.getCount(); i++) {

                int _id = c.getInt(0);
                int tid = c.getInt(1);
                int ptid = c.getInt(2);

                if(ptid==0){
                    Cursor check = database.rawQuery(
                            "select tid,server_task_id from task_master where tid="
                                    + tid + " and server_task_id !='0'", null);

                    check.moveToFirst();

                    if (check.getCount() > 0) {

                        int tid_task = check.getInt(1);
                        String t = "_id=" + _id;
                        ContentValues c_value = new ContentValues();
                        c_value.put("sid", tid_task);
                        c_value.put("isdown_track", "1");
                        long temp = database.update("download_video", c_value, t,
                                null);
                        if (temp > 0) {
                        }
                    }

                }else {
                        String t = "_id=" + _id;
                        ContentValues c_value = new ContentValues();
                        c_value.put("sid", ptid);
                        c_value.put("isdown_track", "1");
                        long temp = database.update("download_video", c_value, t,
                                null);
                        if (temp > 0) {
                        }
                    }
                c.moveToNext();
            }
        }
    }

    public String webservice(JSONObject data1, JSONObject data2,
                             SoapObject data, String URL1, String Soap_action, int serverid) {
        String resTxt = null;
        try {

            JSONArray jsonArray = new JSONArray();
            PropertyInfo pi = new PropertyInfo();
            pi.setName("data");
            pi.setValue(jsonArray.put(data1).toString());
            data.addProperty(pi);

            JSONArray jsonArray2 = new JSONArray();
            PropertyInfo pi1 = new PropertyInfo();
            pi1.setName("auth1");
            pi1.setValue("");
            data.addProperty(pi1);

            SoapSerializationEnvelope envelope = new SoapSerializationEnvelope(
                    SoapEnvelope.VER11);
            envelope.dotNet = true;
            envelope.setOutputSoapObject(data);
            envelope.bodyOut = data;
            Log.d("ENVELOPE", "" + "Coming3");
            //TrustManagerManipulator.allowAllSSL();

            HttpTransportSE androidHttpTransport = new HttpTransportSE(URL1,
                    TIMEOUT);
            androidHttpTransport.debug = true;
            String t = androidHttpTransport.requestDump;
            androidHttpTransport.call(Soap_action, envelope);
            Object result = envelope.getResponse();

            SoapObject response1 = (SoapObject) envelope.bodyIn;
            SoapPrimitive response = (SoapPrimitive) envelope.getResponse();
            // Assign it to resTxt variable static variable
            resTxt = response.toString();

            JSONArray jsonArray1 = new JSONArray(resTxt);
            for (int k = 0; k < jsonArray1.length(); k++) {
                JSONObject jsonObject = jsonArray1.getJSONObject(0);
                String status = jsonObject.getString("status");
            }
            return resTxt;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return resTxt;
    }


}
