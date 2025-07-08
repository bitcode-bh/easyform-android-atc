package com.sky.atc.easyformse.download;

import android.content.ContentValues;
import android.content.Intent;
import android.util.JsonReader;
import android.util.JsonToken;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.URLEncoder;

import io.michaelrocks.paranoid.Obfuscate;


//QUESTION LOG DOWNLOAD SERVICE
@Obfuscate
public class DowoloadQuestionLogService extends WakefulIntentService {

    SQLiteDatabase database;
    int taskdownloadflag = 0;

    public DowoloadQuestionLogService() {
        super("f_download");
    }

    @Override
    protected void doWakefulWork(Intent intent) {
        database = sqlitewraper.getDatabase();
        downloadQuestionLog();
    }

    private void downloadQuestionLog() {

        int k = 0;
        Cursor cmax = database
                .rawQuery(
                        "SELECT tid,server_task_id,que_id,que_milli  FROM  task_master WHERE  islogdown='0';",
                        null);

        if (cmax.getCount() > 0) {
            cmax.moveToFirst();
            try {

                //Download Question Log for Each task
                for (int i = 0; i < cmax.getCount(); i++) {

                    int tid_n = cmax.getInt(0);
                    String stid = cmax.getString(1);
                    String que_id = cmax.getString(2);
                    String que_milli = cmax.getString(3);
                    Log.d("##LOGDOWNLOAD", String.valueOf(tid_n));

                    String appid = DeviceEventsUtils.getLoginDetails().get(2);

                    if (stid == null) {
                        stid = "0";
                    }

                    JSONObject data1 = new JSONObject();
                    data1.put("appid", appid);
                    data1.put("taskid", stid);
                    data1.put("quetionlogid", que_id);
                    data1.put("quetionlogmilli", que_milli);

                    JSONArray jsds = new JSONArray();
                    jsds.put(data1);

                    String url = DownloadConstant.DOWNLOAD_URL + "DownloadStreammingQuestionLog?Data=";
                    String da = URLEncoder.encode(jsds.toString(), "UTF-8");
                    url = url + da;
                    //Webservice call
                    HttpResponse response = downloadWithStreming(url, data1);
                    if (response != null) {
                        //Fetch Question log data fro single task
                        k = fetchingQuestionLogData(response, tid_n);
                    } else {
                        k = 1;
                    }
                    cmax.moveToNext();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        cmax.close();
    }

    private int fetchingQuestionLogData(HttpResponse response, int tid) {

        int d = 0;
        int k = 0;
        int server_task_id = -4, c_id = 0, c_type = 0;
        String data = "", step = "", milli = "", question_log_id = "";
        int flow_id = 0;
        String type = "1";

        try {
            StatusLine statusLine = response.getStatusLine();
            int statusCode = statusLine.getStatusCode();

            if (statusCode == 200) {
                HttpEntity entity = response.getEntity();
                InputStream content = entity.getContent();
                Reader streamReader = new InputStreamReader(content);
                JsonReader reader = new JsonReader(streamReader);
                reader.setLenient(true);
                try {
                    while (reader.hasNext() && (!(reader.peek() == JsonToken.END_DOCUMENT))) {


                        String status1 = "";
                        String message = "";

                        if (!(reader.peek() == JsonToken.END_DOCUMENT)) {
                            reader.beginObject();
                            String status = reader.nextName();
                            if (status.equals("status")) {
                                status1 = reader.nextString();
                            }
                            String message1 = reader.nextName();
                            if (message1.equals("message")) {
                                message = reader.nextString();
                            }

                            if (status1.equalsIgnoreCase("2")) {

                                Log.d("##LOGDOWNLOADSTATUS2", String.valueOf(tid));
                                String t1;
                                t1 = "_id = 4";
                                ContentValues cv2 = new ContentValues();

                                cv2.put("status", "2");

                                long temp12 = database.update("download_counter", cv2, t1,
                                        null);

                                String t2 = "tid=" + tid;
                                ContentValues cv3 = new ContentValues();
                                cv3.put("islogdown", "1");

                                long tempTask = database.update(
                                        "task_master", cv3, t2, null);

                                d = 2;
                            }
                            if (status1.equalsIgnoreCase("1")) {

                                Log.d("##LOGDOWNLOADSTATUS1", String.valueOf(tid));

                                JSONArray innerdata = new JSONArray(message);
                                int length = innerdata.length();
                                for (int length1 = 0; length1 < length; length1++) {
                                    JSONObject innerdatobj = innerdata.getJSONObject(length1);
                                    server_task_id = innerdatobj.getInt("id");
                                    data = innerdatobj.getString("question_log_data");
                                    step = innerdatobj.getString("step");
                                    c_id = innerdatobj.getInt("question_c_id");
                                    c_type = innerdatobj.getInt("question_c_type");

                                    milli = innerdatobj.getString("question_log_milli");
                                    question_log_id = innerdatobj.getString("question_log_id");

                                    Cursor c3 = database.rawQuery(
                                            "select  tid from task_master where server_task_id="
                                                    + server_task_id, null);
                                    c3.moveToFirst();
                                    if (c3.getCount() > 0) {
                                        tid = c3.getInt(0);
                                        ContentValues c = new ContentValues();
                                        c.put("f_data", data);
                                        c.put("tid", tid);
                                        c.put("f_name", "0");
                                        c.put("flag", "1");
                                        c.put("step", step);
                                        c.put("c_type", c_type);
                                        c.put("c_id", c_id);
                                        c.put("f_value", c_id);
                                        c.put("f_key", "0");
                                        Cursor c1 = database.rawQuery(
                                                "select * from f_master where tid=" + tid
                                                        + " and step=" + step + " and c_id=" + c_id,
                                                null);
                                        if (c1.getCount() > 0) {
                                            String t = " tid=" + tid + " and step=" + step
                                                    + " and c_id=" + c_id;
                                            long temp = database.update("f_master", c, t, null);

                                        } else {
                                            long temp = database.insert("f_master", null, c);
                                        }
                                        if (type.equals("1")) {

//                                            updateUserDefineFlow(flow_id, "main_que_id", question_log_id, "main_que_millisecond", milli);
                                            updateIntoTaskMaster(tid, question_log_id, milli);
                                        }

                                        cursorClose(c1);
                                    }
                                    cursorClose(c3);
                                    k = 1;

                                }
                                if (status1.equals("2")) {
                                    k = 0;
                                }
                            }

                            if (status1.equalsIgnoreCase("5")) {
                                d = 1;
                            }

                            Log.d("##QQ", reader.toString());
                            reader.endObject();

                        } else {
                            reader.close();
                            reader = null;
                            streamReader.close();
                        }
                    }
                    reader.close();
                    streamReader.close();

                    if (taskdownloadflag != 0) {
                        return 1;
                    }
                } catch (Exception e) {
                    reader.close();
                    streamReader.close();
                }
            } else {
                return 1;
            }
        } catch (Exception e) {
            d = 1;
        }
        return d;
    }


    private void cursorClose(Cursor c) {
        try {
            if (c != null) {
                c.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    //UPDATE MILLI OF QUSETIONLOG IN TASK MASTER
    private void updateIntoTaskMaster(int tid, String questionID, String questionMilli) {

        String t2 = "tid=" + tid;
        ContentValues cv3 = new ContentValues();
        cv3.put("que_id", questionID);
        cv3.put("que_milli", questionMilli);
        long temp12 = database.update(
                "task_master", cv3, t2, null);

        Log.d("##LOGDOWNLOADUPDTAE", String.valueOf(tid));
    }

    //DOWNLOAD WITH STREAMING
    private HttpResponse downloadWithStreming(String url, JSONObject data) throws Exception {

        taskdownloadflag = 0;

        HttpResponse httpResponse = null;
        try {
            HttpClient client = new DefaultHttpClient();
            HttpGet httpGet = new HttpGet(url);

            JSONObject data2 = null;
            String u_c = null;
            String username = null;
            String userId = null;
            try {
                database = sqlitewraper.getDatabase();
                Cursor c3 = database.rawQuery("SELECT username,u_c,company_id,appid,user_id FROM Login_Master",
                        null);
                c3.moveToLast();
                username = c3.getString(0);
                u_c = c3.getString(1);
                int company_id = c3.getInt(2);
                String appid = c3.getString(3);
                userId = c3.getString(4);
                c3.close();

                data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);
                data2.put("user_id", userId);


            } catch (Exception e) {
                e.printStackTrace();
            }

            httpGet.addHeader("auth1", data2.toString());
            httpGet.addHeader("uname", username);
            httpGet.addHeader("u_c", u_c);
            httpGet.addHeader("user_id", userId);
            JSONArray jsds = new JSONArray();
            jsds.put(data);
//            httpGet.setEntity(new StringEntity(jsds.toString(), HTTP.UTF_8));
            HttpResponse response = client.execute(httpGet);
            StatusLine statusLine = response.getStatusLine();
            int statusCode = statusLine.getStatusCode();
            httpResponse = response;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return httpResponse;
    }


}
