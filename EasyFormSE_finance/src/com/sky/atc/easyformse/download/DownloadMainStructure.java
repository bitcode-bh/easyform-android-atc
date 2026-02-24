package com.sky.atc.easyformse.download;

import static com.sky.atc.easyformse.download.DownloadConstant.WCFURL;

import android.annotation.SuppressLint;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.JsonReader;
import android.util.JsonToken;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.MyObject;
import com.sky.atc.easyformse.NewWebservicesCallEasyform;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.ToastUtil;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.ph_s;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.StatusLine;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Date;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

@StringFogIgnore
class DownloadMainStructure {

    private ArrayList<MyObject> mylist;
    private int taskdownloadflag = 0;
    private int userDefinecount = 1;
    private int flagUserDefine = 1;
    private int counterFlowMaster = 1;
    private int flagFlowMaster = 1;
    private int counterChecksheet = 1;
    private int flagChecksheet = 1;
    private int flowCounter = 1;
    private int t_id_n = 0;
    private int u_id = -2;
    private int counterTaskMaster = 1;
    private int flagTaskMaster = 1;
    private int counterThreshold = 1;
    private int flagThreshold = 1;
    private SQLiteDatabase database = sqlitewraper.getDatabase();
    private boolean isFirsttime = isFirsttime();
    private boolean countCounter=true;


    //Counter Download
    int downloadCounter() {

        database = sqlitewraper.getDatabase();

        mylist = new ArrayList<>();

        int k = 0;
        try {
            JSONObject data1 = data();

            Cursor c3 = database
                    .rawQuery(
                            "SELECT username,u_c,company_id,user_id,appid FROM  Login_Master",
                            null);
            c3.moveToLast();
            String username = c3.getString(0);
            String u_c = c3.getString(1);
            int company_id = c3.getInt(2);
            int user_id = c3.getInt(3);
            String appid = c3.getString(4);

            cursorClose(c3);

            String user_define_millisecond = getMillisecond(" User_Define_Flow_Master");
            String checksheet_millisecond = getMillisecond(" checksheet");
            String flow_master_millisecond = getMillisecond(" flow_master");

            data1.put("UserDefine_Millisecond", user_define_millisecond);
            data1.put("Checksheet_Millisecond", checksheet_millisecond);
            data1.put("Flow_Millisecond", flow_master_millisecond);
            data1.put("user_name", username);
            data1.put("u_c", u_c);
            data1.put("CheckCounterFlag", "All");
            data1.put("survey_mode", "0");
            data1.put("cndn", "0");
            data1.put("flow_id", "0");
            data1.put("task_millisecond", "0");
            data1.put("userid", user_id);
            data1.put("appid", appid);
            data1.put("servermillisecond",getServerMilliFromLogin());

            String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data1, WCFURL, DownloadConstant.METHOD_COUNTER);
            k = counterData(restext);

        } catch (Exception e) {
            k = 1;
            writeLogToFile(e.getMessage(), "DOWNLOAD_COUNTER");
        }
        return k;
    }

    //FETCHING USER DATA FROM LOGIN MASTER
    private JSONObject data() {

        JSONObject data1 = new JSONObject();
        Cursor c3 = database.rawQuery("SELECT username,u_c,appid,user_id,company_id FROM  Login_Master",
                null);
        c3.moveToLast();
        String username = c3.getString(0);
        String u_c = c3.getString(1);
        String appid = c3.getString(2);
        String userid = c3.getString(3);
        String companyId = c3.getString(4);
        cursorClose(c3);

        try {
            data1.put("user_name", username);
            data1.put("u_c", u_c);
            data1.put("appid", appid);
            data1.put("User_Id", userid);
            data1.put("Company_Id", companyId);
        } catch (JSONException e) {
            // TODO Auto-generated catch block
        }
        return data1;

    }

    //get counter data
    private int counterData(String restext) {
        int d = 0;
        try {

            JSONArray jsonArray = new JSONArray(restext);

            String status1 = null;
            int totalcounter_checksheet;
            int totalcounter_userdefine;
            int total_flow;

            for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                JSONObject jsonObject = jsonArray.getJSONObject(0);
                status1 = jsonObject.getString("status");
                if (status1.equalsIgnoreCase("1")) {

                    totalcounter_checksheet = jsonObject
                            .getInt("totalcounter_checksheet");
                    totalcounter_userdefine = jsonObject
                            .getInt("totalcounter_userdefine");
                    total_flow = jsonObject.getInt("totalcounter_flow");

                    if (totalcounter_checksheet != 0) {
                        updateCounter(1, totalcounter_checksheet, 1);
                    }
                    if (total_flow != 0) {

                        updateCounter(4, total_flow, 1);
                    }
                    if (totalcounter_userdefine != 0) {
                        updateCounter(3, totalcounter_userdefine, 1);
                    }
                    d = 2;
                }

            }

        } catch (Exception e) {
            d = 1;
        }
        return d;

    }

    //update counter in to table
    private void updateCounter(int id, int total_counter, int check) {

        if (total_counter > 0) {
            System.out.print("sd");
        }

        int totalcounter_task = 0;
        Cursor c5 = database.rawQuery(
                "SELECT total_count  FROM  download_counter where _id=" + id,
                null);
        c5.moveToFirst();
        if (c5.getCount() > 0 && check == 0) {
            int total_count = c5.getInt(0);

            totalcounter_task = total_counter + total_count;

        } else {
            totalcounter_task = total_counter;
        }
        cursorClose(c5);

        String t4;
        t4 = "_id =" + id;
        ContentValues cv4 = new ContentValues();
        cv4.put("total_count", totalcounter_task);
        if (id != 2){
            cv4.put("counter", 0);
        }
        //nitn
        long temp4 = database.update("download_counter", cv4, t4, null);

    }

    //For User Define Flow Master Download
    int downloadUserDefineFlowMaster() {

        database = sqlitewraper.getDatabase();
        int k = 0;
        try {
            JSONObject data1 = data();

            Cursor c2 = database.rawQuery(
                    "SELECT MAX(millisecond),MAX(id) FROM  User_Define_Flow_Master",
                    null);
            try {
                if (c2.getCount() > 0) {
                    c2.moveToFirst();
                    String millisecond = c2.getString(0);
                    String udfid = c2.getString(1);
                    cursorClose(c2);
                    if (millisecond == null) {
                        data1.put("millisecond", 0);
                    } else {
                        data1.put("millisecond", millisecond);
                    }
                    if (udfid == null) {
                        data1.put("udf_id", 0);
                    } else {
                        data1.put("udf_id", udfid);
                    }
                    data1.put("servermillisecond",getServerMilliFromLogin());
                }
            } catch (JSONException e) {
                // TODO Auto-generated catch block
            }

            JSONArray jsds = new JSONArray();
            jsds.put(data1);

            String appURL;
            String targetUrl;
            String url;
            appURL = sqlitewraper.context.getResources().getString(R.string.App_URL).split("/")[2].trim();
            if(appURL.equalsIgnoreCase("login.easyform.in"))
            {
                // for login url
                url = DownloadConstant.DOWNLOAD_URL + DownloadConstant.METHOD_USERDEFINE_FLOWMASTER_NEW + "?Data=";
            }
            else {
                // for other url
                url = DownloadConstant.DOWNLOAD_URL + DownloadConstant.METHOD_USERDEFINE_FLOWMASTER + "?Data=";
            }


//            String url = sqlitewraper.context.getResources().getString(R.string.TASKDOWNLOADURL) + "/Services/Download_For_Mobile.asmx/DataStreaming_EF_0_1_0_0?Data=";
            String da = URLEncoder.encode(jsds.toString(), "UTF-8");
            url = url + da;

            Response response = downloadWithStremingokhhtp(url, data1,DownloadConstant.METHOD_USERDEFINE_FLOWMASTER);

            if (response != null) {
                k = insertIntoUserDefine(response);
            } else {
                k = 1;
            }
//            HttpResponse response = downloadWithStreming(url, data1);
//            if (response != null) {
//
//                //if server returns status 2 than 2 will be retuned else 1 will be return
//                k = insertIntoUserDefine(response);
//            } else {
//                k = 1;
//            }
        } catch (Exception e) {
            k = 1;
            writeLogToFile(e.getMessage(), "USER_FLOW_MASTER_DOWNLOAD");
        }
        return k;
    }

    //Insert in to user Define database
    private int insertIntoUserDefine(Response response) {

        int d = 0;
        JsonReader reader = null;
        InputStreamReader streamReader = null;

        try {
            int statusCode = response.code();

            if (statusCode == 200) {

                ResponseBody body = response.body();
                if (body == null) return 1;

                InputStream content = body.byteStream();
                streamReader = new InputStreamReader(content);
                reader = new JsonReader(streamReader);
                reader.setLenient(true);

                try {
                    while (reader.hasNext() && reader.peek() != JsonToken.END_DOCUMENT) {

                        String status1 = "";
                        String message = "";

                        reader.beginObject();

                        while (reader.hasNext()) {
                            String name = reader.nextName();

                            if ("status".equals(name)) {
                                status1 = reader.nextString();
                            } else if ("message".equals(name)) {
                                message = reader.nextString();
                            } else {
                                reader.skipValue();
                            }
                        }

                        String str = "status -"+ status1;
                        DeviceEventsUtils.showToast(str);


                        // ===== status = 2 =====
                        if (status1.equalsIgnoreCase("2")) {

                            ContentValues cv2 = new ContentValues();
                            cv2.put("status", "2");

                            database.update(
                                    "download_counter",
                                    cv2,
                                    "_id = 3",
                                    null
                            );
                            d = 2;
                        }

                        // ===== status = 1 =====
                        if (status1.equalsIgnoreCase("1")) {

                            JSONArray innerdata = new JSONArray(message);

                            // insert udf data into delete_old_task
                            deleteoldtask(innerdata);

                            for (int i = 0; i < innerdata.length(); i++) {

                                JSONObject innerdatobj = innerdata.getJSONObject(i);

                                int flag = innerdatobj.getInt("flag");
                                int id = innerdatobj.getInt("id");
                                int rollid = innerdatobj.getInt("role_id");
                                int flow_id = innerdatobj.getInt("flow_id");
                                int p_id = innerdatobj.getInt("p_id");
                                int level_position = innerdatobj.getInt("level_position");
                                int company_id = innerdatobj.getInt("company_id");

                                String flow_name = innerdatobj.getString("name");
                                String flow_name1 = innerdatobj.getString("flowname");
                                String millisecond = innerdatobj.getString("millisecond");
                                String type = innerdatobj.getString("type");
                                String data = innerdatobj.getString("data");

                                String isDeleted = innerdatobj.has("is_delete")
                                        ? innerdatobj.getString("is_delete")
                                        : "0";

                                ContentValues cv2 = new ContentValues();
                                cv2.put("counter", userDefinecount);

                                database.update(
                                        "download_counter",
                                        cv2,
                                        "_id = 3",
                                        null
                                );

                                generateNotification(3, null);

                                ContentValues cv = new ContentValues();
                                cv.put("id", id);
                                cv.put("flow_id", flow_id);
                                cv.put("p_id", p_id);
                                cv.put("rollid", rollid);
                                cv.put("level_position", level_position);
                                cv.put("company_id", company_id);
                                cv.put("flow_name", flow_name);
                                cv.put("flow_name1", flow_name1);
                                cv.put("type", type);
                                cv.put("data", data);
                                cv.put("millisecond", millisecond);
                                cv.put("isflag", flag);
                                cv.put("is_delete", isDeleted);

                                Cursor c1 = database.rawQuery(
                                        "select isflag from User_Define_Flow_Master where id=" + id,
                                        null
                                );

                                if (c1.getCount() > 0) {
                                    c1.moveToFirst();
                                    int flag_inst = c1.getInt(0);

                                    if (flag != flag_inst) {
                                        cv.put("task_millisecond", "0");
                                    }

                                    database.update(
                                            "User_Define_Flow_Master",
                                            cv,
                                            "id=" + id,
                                            null
                                    );
                                } else {
                                    cv.put("task_millisecond", "0");
                                    database.insert(
                                            "User_Define_Flow_Master",
                                            null,
                                            cv
                                    );
                                }

                                cursorClose(c1);
                                userDefinecount++;
                                flagUserDefine = 0;
                            }

                            d = 1;
                        }

                        // ===== status = 5 =====
                        if (status1.equalsIgnoreCase("5")) {
                            d = 1;
                        }

                        reader.endObject();
                    }

                    if (taskdownloadflag != 0) {
                        return 1;
                    }

                } catch (Exception e) {
                    d = 1;
                } finally {
                    if (reader != null) reader.close();
                    if (streamReader != null) streamReader.close();
                    body.close();
                }

            } else {
                return 1;
            }

        } catch (Exception e) {
            d = 1;
        }

        return d;
    }

    //close the Cursor after use
    private void cursorClose(Cursor c) {
        try {
            if (c != null) {
                c.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    //For UserDefineflowmaster Download
    private String getMillisecond(String table_name) {

        String millisecond_get = "";
        Cursor c2 = database.rawQuery("SELECT MAX(millisecond) FROM"
                + table_name, null);

        try {
            if (c2.getCount() > 0) {
                c2.moveToFirst();
                String millisecond = c2.getString(0);
                cursorClose(c2);
                if (millisecond == null) {
                    millisecond_get = "0";
                } else {
                    millisecond_get = millisecond;
                }
            }
        } catch (Exception ignored) {

        }
        return millisecond_get;
    }

    //Checksheet Download
    int checksheetDownload() {

        int k = 0;
        JSONObject data1 = data();
        Cursor c2 = database.rawQuery(
                "SELECT MAX(millisecond),MAX(stepid) FROM  checksheet", null);
        try {
            if (c2.getCount() > 0) {
                c2.moveToFirst();
                String millisecond = c2.getString(0);
                String stepid = c2.getString(1);
                cursorClose(c2);
                if (millisecond == null) {
                    data1.put("millisecond", 0);
                } else {
                    data1.put("millisecond", millisecond);
                }

                if (stepid == null) {
                    data1.put("Step_Id", 0);
                } else {
                    data1.put("Step_Id", stepid);
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }


        JSONArray jsds = new JSONArray();
        jsds.put(data1);

        try {
            String url = DownloadConstant.DOWNLOAD_URL + DownloadConstant.METHOD_CHECKSHEET + "?Data=";
//            String url = sqlitewraper.context.getResources().getString(R.string.TASKDOWNLOADURL) + "/Services/Download_For_Mobile.asmx/DataStreaming_EF_0_1_0_0?Data=";
            String da = URLEncoder.encode(jsds.toString(), "UTF-8");
            url = url + da;
//            HttpResponse response = downloadWithStreming(url, data1);
//            if (response != null) {
//                k = insertIntoChecksheet(response);
//            } else {
//                k = 1;
//            }

            Response response = downloadWithStremingokhhtp(url, data1,DownloadConstant.METHOD_CHECKSHEET);

            if (response != null) {
                k = insertIntoChecksheet(response);
            } else {
                k = 1;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

//        String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data1, WCFURL, DownloadConstant.METHOD_CHECKSHEET);
//        k = insertIntoChecksheet(restext);
        return k;
    }

    //Insert into Checksheet master table
    private int insertIntoChecksheet(Response response) {

        int d = 0;
        JsonReader reader = null;
        InputStreamReader streamReader = null;

        try {
            int statusCode = response.code();

            if (statusCode == 200) {

                ResponseBody body = response.body();
                if (body == null) return 1;

                InputStream content = body.byteStream();
                streamReader = new InputStreamReader(content);
                reader = new JsonReader(streamReader);
                reader.setLenient(true);

                try {
                    while (reader.hasNext() && reader.peek() != JsonToken.END_DOCUMENT) {

                        String status1 = "";
                        String message = "";

                        reader.beginObject();

                        while (reader.hasNext()) {
                            String name = reader.nextName();

                            if (name.equals("status")) {
                                status1 = reader.nextString();
                            } else if (name.equals("message")) {
                                message = reader.nextString();
                            } else {
                                reader.skipValue();
                            }
                        }

                        String str = "status -"+ status1;
                        DeviceEventsUtils.showToast(str);

                        // ===== status = 1 =====
                        if (status1.equalsIgnoreCase("1")) {

                            JSONArray innerdata = new JSONArray(message);
                            int length = innerdata.length();

                            for (int j = 0; j < length; j++) {

                                JSONObject innerdatobj = innerdata.getJSONObject(j);

                                int checksheetid = innerdatobj.getInt("checksheetid");
                                int c_type = innerdatobj.getInt("c_type");
                                String c_name = innerdatobj.getString("c_name");
                                String moduleid = innerdatobj.getString("moduleid");
                                String module_name = innerdatobj.getString("module_name");
                                String moduledef = innerdatobj.getString("moduledef");
                                String buttons = innerdatobj.getString("buttons");
                                String date = innerdatobj.getString("updateddate");

                                String step = innerdatobj.getString("stepno");
                                String subcategory = innerdatobj.getString("subcategory");
                                String data_1 = innerdatobj.getString("data");
                                String milli = innerdatobj.getString("millisecond");
                                String step_short_name = innerdatobj.getString("step_short_name");
                                String stepId = innerdatobj.getString("step_id");

                                ContentValues cv2 = new ContentValues();
                                cv2.put("counter", counterChecksheet);

                                database.update(
                                        "download_counter",
                                        cv2,
                                        "_id = 1",
                                        null
                                );

                                generateNotification(1, null);

                                Cursor c1 = database.rawQuery(
                                        "select * from checksheet where checksheetid='"
                                                + checksheetid + "' and step='" + step + "'",
                                        null
                                );

                                if (c1.getCount() > 0) {

                                    updateChecksheet(
                                            checksheetid,
                                            c_name,
                                            data_1,
                                            buttons,
                                            step,
                                            subcategory,
                                            date,
                                            milli,
                                            c_type,
                                            step_short_name,
                                            "checksheet",
                                            stepId
                                    );

                                } else {

                                    ContentValues cv1 = new ContentValues();
                                    cv1.put("checksheetid", checksheetid);
                                    cv1.put("c_name", c_name);
                                    cv1.put("data", data_1);
                                    cv1.put("c_type", c_type);
                                    cv1.put("buttons", buttons);
                                    cv1.put("step", step);
                                    cv1.put("subcategory", subcategory);
                                    cv1.put("date", date);
                                    cv1.put("millisecond", milli);
                                    cv1.put("step_short_name", step_short_name);
                                    cv1.put("stepid", stepId);

                                    database.insert("checksheet", null, cv1);
                                }

                                counterChecksheet++;
                                flagChecksheet = 0;
                                cursorClose(c1);
                            }

                            d = 1;
                        }

                        // ===== status = 2 =====
                        if (status1.equalsIgnoreCase("2")) {

                            ContentValues cv2 = new ContentValues();
                            cv2.put("status", "2");

                            database.update(
                                    "download_counter",
                                    cv2,
                                    "_id = 1",
                                    null
                            );

                            d = 2;
                        }

                        // ===== status = 5 =====
                        if (status1.equalsIgnoreCase("5")) {
                            d = 1;
                        }

                        reader.endObject();
                    }

                    if (taskdownloadflag != 0) {
                        return 1;
                    }

                } catch (Exception e) {
                    d = 1;
                } finally {
                    if (reader != null) reader.close();
                    if (streamReader != null) streamReader.close();
                    body.close();
                }

            } else {
                return 1;
            }

        } catch (Exception e) {
            d = 1;
        }

        return d;
    }

    private void updateChecksheet(int checksheetid, String c_name, String data_1,
                                  String buttons, String step, String subcategory, String date,
                                  String milli, int c_type, String step_short_name, String t_name,String stepId) {
        String t2;
        t2 = "checksheetid='" + checksheetid + "' and step='" + step + "'";
        ContentValues cv1 = new ContentValues();

        cv1.put("checksheetid", checksheetid);
        cv1.put("c_name", c_name);
        cv1.put("data", data_1);
        cv1.put("buttons", buttons);
        cv1.put("step", step);
        cv1.put("subcategory", subcategory);
        cv1.put("date", date);
        cv1.put("c_type", c_type);
        cv1.put("millisecond", milli);
        cv1.put("step_short_name", step_short_name);
        cv1.put("stepid", stepId);
        long temp = database.update(t_name, cv1, t2, null);

    }


    //Flow Master Download
    int flowMasterDownload() {
        String restext = null;
        int k = 0;

        try {
            database = sqlitewraper.getDatabase();

            JSONObject data1 = data();

            Cursor c3 = database.rawQuery(
                    "SELECT appid FROM Login_Master", null);
            c3.moveToFirst();
            String appid;
            int count = c3.getCount();
            try{
                if (count > 0) {
                    appid = c3.getString(0);

                    if (appid == null) {
                        data1.put("app_id", 0);
                    } else {
                        data1.put("app_id", appid);
                    }
                }
            }catch (Exception e){
                e.printStackTrace();
            }
            c3.close();

            Cursor c2 = database.rawQuery(
                    "SELECT MAX(millisecond),MAX(moduleid) FROM  flow_master ", null);

            try {
                if (c2.getCount() > 0) {
                    c2.moveToFirst();

                    String millisecond = c2.getString(0);
                    String flowId = c2.getString(1);
                    cursorClose(c2);

                    if (millisecond == null) {
                        data1.put("millisecond", 0);
                    } else {

                        data1.put("millisecond", millisecond);
                    }
                    if (flowId == null) {
                        data1.put("flow_id", 0);
                    } else {
                        data1.put("flow_id", flowId);
                    }
                }
            } catch (JSONException e) {
                // TODO Auto-generated catch block
            }

            JSONArray jsds = new JSONArray();
            jsds.put(data1);

            String url = DownloadConstant.DOWNLOAD_URL + DownloadConstant.METHOD_FLOWMASTER + "?Data=";
            String da = URLEncoder.encode(jsds.toString(), "UTF-8");
            url = url + da;
            Response response = downloadWithStremingokhhtp(url, data1,DownloadConstant.METHOD_FLOWMASTER);

            if (response != null) {
                k = insertIntoFlowMaster(response);
            } else {
                k = 1;
            }

//            HttpResponse response = downloadWithStreming(url, data1);
//            if (response != null) {
//                k = insertIntoFlowMaster(response);
//            } else {
//                k = 1;
//            }

        } catch (Exception e) {
            e.printStackTrace();
            writeLogToFile(e.getMessage(), "FLOW_MASTER_DOWNLOAD");
            // TODO: handle exception
        }
        return k;
    }


    private int insertIntoFlowMaster(Response response) {

        int d = 0;
        JsonReader reader = null;
        InputStreamReader streamReader = null;

        try {
            int statusCode = response.code();

            if (statusCode == 200) {

                ResponseBody body = response.body();
                if (body == null) return 1;

                InputStream content = body.byteStream();
                streamReader = new InputStreamReader(content);
                reader = new JsonReader(streamReader);
                reader.setLenient(true);

                try {
                    while (reader.hasNext() && reader.peek() != JsonToken.END_DOCUMENT) {

                        String status1 = "";
                        String message = "";

                        reader.beginObject();

                        while (reader.hasNext()) {
                            String name = reader.nextName();

                            if (name.equals("status")) {
                                status1 = reader.nextString();
                            } else if (name.equals("message")) {
                                message = reader.nextString();
                            } else {
                                reader.skipValue();
                            }
                        }

                        String str = "status -"+ status1;
                        DeviceEventsUtils.showToast(str);

                        // ===== status = 2 =====
                        if (status1.equalsIgnoreCase("2")) {

                            ContentValues cv2 = new ContentValues();
                            cv2.put("status", "2");

                            database.update(
                                    "download_counter",
                                    cv2,
                                    "_id = 4",
                                    null
                            );

                            d = 2;
                        }

                        // ===== status = 1 =====
                        if (status1.equalsIgnoreCase("1")) {

                            JSONArray innerdata = new JSONArray(message);
                            int length = innerdata.length();

                            for (int j = 0; j < length; j++) {

                                JSONObject innerdatobj = innerdata.getJSONObject(j);

                                int moduleid = innerdatobj.getInt("moduleid");
                                String module_name = innerdatobj.getString("module_name");
                                String millisecond = innerdatobj.getString("millisecond");
                                int company_id1 = innerdatobj.getInt("company_id");
                                int checksheet_id = innerdatobj.getInt("checksheet_id");
                                String checklist_data = innerdatobj.getString("data");

                                ContentValues cv2 = new ContentValues();
                                cv2.put("counter", counterFlowMaster);

                                database.update(
                                        "download_counter",
                                        cv2,
                                        "_id = 4",
                                        null
                                );

                                generateNotification(4, null);

                                Cursor c4 = database.rawQuery(
                                        "SELECT * FROM flow_master WHERE moduleid = " + moduleid,
                                        null
                                );
                                c4.moveToFirst();

                                ContentValues cv1 = new ContentValues();
                                cv1.put("moduleid", moduleid);
                                cv1.put("module_name", module_name);
                                cv1.put("millisecond", millisecond);
                                cv1.put("company_id", company_id1);
                                cv1.put("checksheet_id", checksheet_id);
                                cv1.put("data", checklist_data);

                                if (c4.getCount() > 0) {
                                    database.update(
                                            "flow_master",
                                            cv1,
                                            "moduleid = " + moduleid,
                                            null
                                    );

                                    if (!isFirsttime) {
                                        counterFlowMaster++;
                                    }
                                } else {
                                    database.insert("flow_master", null, cv1);
                                    counterFlowMaster++;
                                }

                                d = 1;
                                cursorClose(c4);
                            }

                            flagFlowMaster = 0;
                        }

                        // ===== status = 5 =====
                        if (status1.equalsIgnoreCase("5")) {
                            d = 1;
                        }

                        reader.endObject();
                    }

                    if (taskdownloadflag != 0) {
                        return 1;
                    }

                } catch (Exception e) {
                    d = 1;
                } finally {
                    if (reader != null) reader.close();
                    if (streamReader != null) streamReader.close();
                    body.close();
                }

            } else {
                return 1;
            }

        } catch (Exception e) {
            d = 1;
        }

        return d;
    }



    //TASK DOWNLOAD
    int taskmasterDownloadGlobal(int i) {

        int k = 0;
        try {


            Cursor c3 = database.rawQuery(
                    "SELECT username,u_c,user_id,appid,servermilli,main_id,sub_id,main_milli,sub_milli FROM  Login_Master", null);
            c3.moveToLast();
            String username = c3.getString(0);
            String u_c = c3.getString(1);
            int user_id = c3.getInt(2);
            String appid = c3.getString(3);
            String servermilli = c3.getString(4);
            String main_id = c3.getString(5);
            String sub_id = c3.getString(6);
            String main_milli = c3.getString(7);
            String sub_milli = c3.getString(8);


            cursorClose(c3);


            JSONObject data1 = new JSONObject();
            data1.put("user_id", user_id);
            data1.put("appid", appid);
            data1.put("main_task_id", main_id);
            data1.put("sub_task_id", sub_id);
            data1.put("main_task_id_milli", main_milli);
            data1.put("sub_task_id_milli", sub_milli);
            data1.put("servermilli", servermilli);
            data1.put("flowidlist",getListOfFlowID());

            JSONArray json = new JSONArray();
            json.put(data1);

            if (countCounter) {
                taskDownloadCounter(data1);
                countCounter=false;
            }

            generateNotification(2, getFlowName(0));
//            String url = DownloadConstant.DOWNLOAD_URL + "/DowanloadStreammingTaskAndSubTask?Data=";
            String url = DownloadConstant.DOWNLOAD_URL + "DowanloadStreammingTaskAndSubTaskWithFlowList?Data=";
            String da = URLEncoder.encode(json.toString(), "UTF-8");
            url = url + da;
            k = taskDownloadingwithStreaming(url, da, 0, 0);

            if (k == 2 || k == 0) {

                if (k == 0) {
                    k = 1;
                }
                if (k == 2) {

                    String t3;
                    t3 = "_id = 2";
                    ContentValues cv4 = new ContentValues();
                    cv4.put("status", "2");
                    long temp123 = database.update(
                            "download_counter", cv4, t3, null);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            k = 1;
        }
        return k;
    }


    //to get the flow name of flow id.
    private String getFlowName(int flowId) {

        String flowname = "";
        try {

            Cursor c3 = database.rawQuery(
                    "SELECT module_name FROM  flow_master where moduleid='" + flowId + "'", null);
            c3.moveToFirst();
            if (c3.getCount() > 0) {
                flowname = c3.getString(0);
            }
            cursorClose(c3);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return flowname;
    }

    private int arrManage(int flow_id, int k_final) {
        int send = 0;
        int k_final_get = -1;
        int index = -1;

        try {
            if (containsflowid(flow_id)) {

                for (int i = 0; i < mylist.size(); i++) {
                    MyObject m = mylist.get(i);
//                    if (m.flowid == flow_id) {
//                        k_final_get = m.value;
//                        index = i;
//                    }
                }
                if (k_final != 0) {
                    mylist.set(index, new MyObject(flow_id, k_final));
                }
                if (k_final_get == 1 && k_final == 1) {
                    mylist.set(index, new MyObject(flow_id, 2));

                } else if (k_final_get == 1) {
                    k_final_get = 0;
                }
                send = k_final_get;

            } else {
                mylist.add(new MyObject(flow_id, k_final));
                send = 0;
            }

        } catch (Exception e) {
            if (e instanceof IndexOutOfBoundsException) {
                mylist.add(new MyObject(flow_id, k_final));
            }
            send = 0;
        }
        return send;
    }


    //task counter download
    private void taskDownloadCounter(JSONObject data) {

        database = sqlitewraper.getDatabase();

        int k = 0;
        try {

            String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data, WCFURL, DownloadConstant.METHOD_COUNTER_TASK);
            JSONArray jsonArray = new JSONArray(restext);

            String status1 = null;
            int totalcounter_task;

            for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                JSONObject jsonObject = jsonArray.getJSONObject(0);
                status1 = jsonObject.getString("status");

                if (status1.equalsIgnoreCase("1")) {

                    totalcounter_task = jsonObject.getInt("totalcounter_task");
                    String t1;
                    t1 = "_id = 2";
                    ContentValues cv2 = new ContentValues();
                    cv2.put("counter", 0);
                    long temp11 = database.update("download_counter", cv2,
                            t1, null);

                    String t2;
                    t2 = "_id = 2";
                    ContentValues cv3 = new ContentValues();
                    cv3.put("total_count", 0);
                    long temp112 = database.update("download_counter", cv3,
                            t2, null);

                    if (totalcounter_task != 0) {
                        updateCounter(2, totalcounter_task, 1);
                    }

                    k = 1;
                }

            }

        } catch (Exception e) {
            e.printStackTrace();

        }

    }


    private boolean containsflowid(int flowid) {
        for (final MyObject transactionLine : mylist) {
            if (transactionLine.getFlowid() == flowid) {
                return true;
            }
        }
        return false;
    }


    //Utils Functions
    private void writeLogToFile(String response, String method) {
        LogUtils.writeDownloadLogToFile(response, method);
    }

    @SuppressLint("WrongConstant")
    private void generateNotification(int id, String moduleName) {

        String contentText = "Download";

        if (moduleName == null) {
            moduleName = "";
        }

        if (id == 1) {
            contentText = "Steps Downloding...";
        } else if (id == 2) {
            contentText = "Task Downloading...";
        } else if (id == 3) {
            contentText = "UserDefine Downloading...";
        } else if (id == 4) {
            contentText = "FlowMaster  Downloading...";
        }
        else if (id == 5) {
            contentText = "Threshold  Downloading...";
        }


        Cursor c2_n = database.rawQuery(
                "Select counter,total_count from download_counter where _id='" + id + "'", null);
        c2_n.moveToFirst();

        int maxcount = 0;
        int curcount = 0;
        if (c2_n.getCount() > 0) {

            curcount = c2_n.getInt(0);
            maxcount = c2_n.getInt(1);
        }

        c2_n.close();

        int icon = R.drawable.atc_logo;

        NotificationChannel mChannel = null;
        String CHANNEL_ID = "my_channel_01";// The id of the channel.

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW);
            mChannel.setSound(null,null);

        }

        Intent intent = new Intent(sqlitewraper.context, ph_s.class);
        PendingIntent contentIntent = PendingIntent.getActivity(sqlitewraper.context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(sqlitewraper.context);

        b.setAutoCancel(false)
                .setWhen(System.currentTimeMillis())
                .setSmallIcon(icon)
                .setContentTitle(getApplicationName(sqlitewraper.context) + " Download")
                .setContentIntent(contentIntent)
                .setContentText(moduleName + " : " + contentText)
//                .setContentInfo(curcount + "/" + maxcount)
                .setSubText(curcount + "/" + maxcount)
                .setOngoing(true)
                .setChannelId(CHANNEL_ID)
                .setOnlyAlertOnce(true)
                .setProgress(maxcount, curcount, false);

        NotificationManager notificationManager = (NotificationManager) sqlitewraper.context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            mChannel.setSound(null,null);
            notificationManager.createNotificationChannel(mChannel);
        }

        if (notificationManager != null) {
            notificationManager.notify(147, b.build());
        }

        if (curcount == maxcount) {
//            notificationManager.cancel(147);
        }
    }

    private String getApplicationName(Context context) {
        ApplicationInfo applicationInfo = context.getApplicationInfo();
        int stringId = applicationInfo.labelRes;
        return stringId == 0 ? applicationInfo.nonLocalizedLabel.toString() : context.getString(stringId);
    }

    //STREAMING DOWNLOAD CALL with httpclient
//    private HttpResponse downloadWithStreming(String url, JSONObject data) throws Exception {
//
//        taskdownloadflag = 0;
//
//        HttpResponse httpResponse = null;
//        try {
//            HttpClient client = new DefaultHttpClient();
//            HttpGet httpGet = new HttpGet(url);
//
//            JSONObject data2 = null;
//            String u_c = null;
//            String username = null;
//            try {
//                database = sqlitewraper.getDatabase();
//                Cursor c3 = database.rawQuery("SELECT username,u_c,company_id,appid,user_id FROM Login_Master",
//                        null);
//                c3.moveToLast();
//                username = c3.getString(0);
//                u_c = c3.getString(1);
//                int company_id = c3.getInt(2);
//                String appid = c3.getString(3);
//                String UserId = c3.getString(4);
//                c3.close();
//
//                data2 = new JSONObject();
//                data2.put("username", username);
//                data2.put("u_c", u_c);
//                data2.put("appid", appid);
//                data2.put("user_id", UserId);
//
//            } catch (Exception e) {
//                e.printStackTrace();
//            }
//
//
//            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
//            String roleid = prefs.getString("authroleidn", "0");
//            String companyFeatureid = prefs.getString("authcompanyfid", "0");
//
//            if( companyFeatureid == null || companyFeatureid.equalsIgnoreCase("") || companyFeatureid.equalsIgnoreCase("0") )
//            {
//                return null;
//            }
//            else {
//                httpGet.addHeader("auth1", data2.toString());
//                httpGet.addHeader("uname", username);
//                httpGet.addHeader("u_c", u_c);
//                httpGet.addHeader("Role_Id", roleid);
//                httpGet.addHeader("Company_Feature_Id", companyFeatureid);
//
//                JSONArray jsds = new JSONArray();
//                jsds.put(data);
////            httpGet.setEntity(new StringEntity(jsds.toString(), HTTP.UTF_8));
//                HttpResponse response = client.execute(httpGet);
//                StatusLine statusLine = response.getStatusLine();
//                int statusCode = statusLine.getStatusCode();
//                httpResponse = response;
//
//            }
//
//
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//        return httpResponse;
//    }

    //STREAMING DOWNLOAD CALL with okhttp
    private Response downloadWithStremingokhhtp(String url, JSONObject data,String webmethod) {

        taskdownloadflag = 0;
        Response httpResponse = null;

        try {
            JSONObject data2 = null;
            String u_c = null;
            String username = null;

            try {
                database = sqlitewraper.getDatabase();
                Cursor c3 = database.rawQuery(
                        "SELECT username,u_c,company_id,appid,user_id FROM Login_Master",
                        null
                );

                if (c3.moveToLast()) {
                    username = c3.getString(0);
                    u_c = c3.getString(1);
                    String appid = c3.getString(3);
                    String UserId = c3.getString(4);

                    data2 = new JSONObject();
                    data2.put("username", username);
                    data2.put("u_c", u_c);
                    data2.put("appid", appid);
                    data2.put("user_id", UserId);
                }
                c3.close();

            } catch (Exception e) {
                e.printStackTrace();
            }

            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
            String roleid = prefs.getString("authroleidn", "0");
            String companyFeatureid = prefs.getString("authcompanyfid", "0");

            if (companyFeatureid == null ||
                    companyFeatureid.equalsIgnoreCase("") ||
                    companyFeatureid.equalsIgnoreCase("0")) {
                return null;
            }

            OkHttpClient okHttpClient = NewWebservicesCallEasyform.getOkHttpClient();

            Request request = new Request.Builder()
                    .url(url)
                    .get()
                    .addHeader("auth1", data2.toString())
                    .addHeader("uname", username)
                    .addHeader("u_c", u_c)
                    .addHeader("Role_Id", roleid)
                    .addHeader("Company_Feature_Id", companyFeatureid)
                    .build();

            String forErrorLog = "\nauth1 :" + data2.toString() + "Role_Id :" + roleid + "Company_Feature_Id :" + companyFeatureid +
                    "matchId" + "0" + "\nBody :" + data;

            long startTime = System.currentTimeMillis();

            String str = "Api -"+ webmethod;
            DeviceEventsUtils.showToast(str);

            httpResponse = okHttpClient.newCall(request).execute();

            int statusCode = httpResponse.code();  // Same as getStatusCode()
            httpResponse = httpResponse;

            long endTime = System.currentTimeMillis();
            LogUtils.writeApilistLogToFile(webmethod, startTime,endTime,sqlitewraper.context);
            LogUtils.writeAllApiCallLog( "Request : " + forErrorLog  + "\n\n\nResponse : " + httpResponse   , url , "");
            if (statusCode != 200) {
                LogUtils.writeApiCallLogToFile("Response code: " + statusCode
                        + "\nJsonData: " + forErrorLog + "Auth1: " + data2.toString(),url, "downloadWithStreming","1");

            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return httpResponse;
    }
    private boolean isFirsttime() {

        Cursor c2 = database.rawQuery(
                "SELECT MAX(millisecond) FROM  flow_master ", null);
        boolean isFirst = false;

        try {
            if (c2.getCount() > 0) {
                c2.moveToFirst();
                String millisecond = c2.getString(0);
                cursorClose(c2);

                if (millisecond != null) {

                    isFirst = false;

                } else {

                    isFirst = true;
                }
            }
        } catch (Exception exeption) {

        }
        return isFirst;
    }

    //task download with Streaming with okhttp
    public int taskDownloadingwithStreaming(String url, String json, int id, int flow_id) {

        taskdownloadflag = 0;
        int k = 0;

        Response response = null;

        try {

            OkHttpClient okHttpClient = NewWebservicesCallEasyform.getOkHttpClient();

            int parent_flow_id = 0, subflow_id = 0;

            JSONObject data2 = null;
            String u_c = null;
            String username = null;
            String userId = null;

            try {
                database = sqlitewraper.getDatabase();
                Cursor c3 = database.rawQuery(
                        "SELECT username,u_c,company_id,appid,user_id FROM Login_Master",
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
            }

            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
            String roleid = prefs.getString("authroleidn", "0");
            String companyFeatureid = prefs.getString("authcompanyfid", "0");

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("auth1", data2.toString())
                    .addHeader("uname", username)
                    .addHeader("u_c", u_c)
                    .addHeader("user_id", userId)
                    .addHeader("Role_Id", roleid)
                    .addHeader("Company_Feature_Id", companyFeatureid)
                    .get()
                    .build();


            response = okHttpClient.newCall(request).execute();

            String forErrorLog = "\nauth1 :" + data2.toString() + "Role_Id :" + roleid + "Company_Feature_Id :" + companyFeatureid +
                    "matchId" + "0" ;

            int statusCode = response.code();

            if (statusCode != 200) {
                k = 0;
                LogUtils.writeApiCallLogToFile("\nJsonData: " + forErrorLog + "url: " + url,  "", "taskDownload","0");

                return k;
            }

            if (statusCode == 200) {

                InputStream content = response.body().byteStream();
                Reader streamReader = new InputStreamReader(content);

                JsonReader reader = new JsonReader(streamReader);
                reader.setLenient(true);

                try {

                    while (reader.hasNext() &&
                            (!(reader.peek() == JsonToken.END_DOCUMENT))) {

                        if (!(reader.peek() == JsonToken.END_DOCUMENT)) {
                            reader.beginObject();
                            String parent_id = reader.nextName();
                            if (parent_id.equals("parent_flow_id")) {
                                parent_flow_id = reader.nextInt();
                            }
                            String sub_id = reader.nextName();
                            if (sub_id.equals("sub_flow_id")) {
                                subflow_id = reader.nextInt();
                            }

                            String ref_task_id = reader.nextName();
                            int ref_id = -3;
                            if (ref_task_id.equals("ref_task_id")) {
                                ref_id = reader.nextInt();
                            }
                            String name = reader.nextName();
                            if (name.equals("table_type")) {

                                String table_type = reader.nextString();
                                String millisecond_val = "0";
                                String id_val = "";
                                String id_n = reader.nextName();
                                if (id_n.equals("id")) {
                                    id_val = reader.nextString();
                                }

                                String millisecond = reader.nextName();
                                if (millisecond.equals("millisecond")) {
                                    millisecond_val = reader.nextString();
                                }

                                String alldata = reader.nextName();

                                if (alldata.equals("alldata")) {

                                    String task_data = reader.nextString();

                                    if (table_type.equals("-1")) {
                                        k = 2;
                                    }

                                    if (table_type.equals("6")) {
                                        updateTaskDown(ref_id, "0", 0, 0);
                                        k = 2;
                                    }

                                    if (table_type.equals("0") || table_type.equals("2")) {

                                        k = insertIntoTaskmaster(task_data,
                                                "task_master",
                                                id,
                                                millisecond_val,
                                                table_type,
                                                id_val,
                                                flow_id);

                                        if (table_type.equals("2")) {
                                            updateTaskDown(ref_id, "0",
                                                    parent_flow_id,
                                                    subflow_id);
                                        }
                                    }

                                    if (table_type.equals("1") || table_type.equals("3")) {

                                        k = insertIntoQuestionlog(task_data,
                                                table_type,
                                                id_val,
                                                millisecond_val,
                                                id,
                                                flow_id);

                                        if (table_type.equals("3")) {
                                            updateTaskDown(ref_id, "0",
                                                    parent_flow_id,
                                                    subflow_id);
                                        }
                                    }

                                    if (table_type.equals("5")) {
                                        updateTaskDown(ref_id, "1", 0, 0);
                                        k = 2;
                                    }
                                }

                                reader.endObject();
                            }
                        }
                    }

                    reader.close();
                    streamReader.close();
                    content.close();

                    if (taskdownloadflag != 0) {
                        k = 1;
                        Intent i_ch = new Intent(sqlitewraper.context,
                                DowoloadQuestionLogService.class);
                        WakefulIntentService.sendWakefulWork(
                                sqlitewraper.context, i_ch);
                    }

                } catch (Exception e) {

                    if (reader != null) reader.close();
                    streamReader.close();
                    content.close();
                }
            }

        } catch (Exception e) {
            return k;
        } finally {
            if (response != null) response.close();  // IMPORTANT
        }

        return k;
    }


    //task download with Streaming with httpclinet
//    public int taskDownloadingwithStreaming(String url, String json, int id, int flow_id) {
//
//        taskdownloadflag = 0;
//        int k = 0;
//        try {
//            ArrayList<NameValuePair> postParameters;
//            postParameters = new ArrayList<NameValuePair>();
//            postParameters.add(new BasicNameValuePair("Data", json));
//
//            StringBuilder builder = new StringBuilder();
//            HttpClient client = new DefaultHttpClient();
//            HttpGet httpGet = new HttpGet(url);
//
//
//            HttpPost post = new HttpPost("/Services/Download_For_Mobile.asmx/DataStreaming");
//            post.setHeader("host", sqlitewraper.context.getResources().getString(R.string.App_URL));
//
//            StringEntity se = new StringEntity(URLEncoder.encode(json, "UTF-8"));
//            post.setEntity(new UrlEncodedFormEntity(postParameters));
//
//            int parent_flow_id = 0, subflow_id = 0;
//
//            JSONObject data2 = null;
//            String u_c = null;
//            String username = null;
//            String userId = null;
//            try {
//                database = sqlitewraper.getDatabase();
//                android.database.Cursor c3 = database.rawQuery("SELECT username,u_c,company_id,appid,user_id FROM Login_Master",
//                        null);
//                c3.moveToLast();
//                username = c3.getString(0);
//                u_c = c3.getString(1);
//                int company_id = c3.getInt(2);
//                String appid = c3.getString(3);
//                userId = c3.getString(4);
//                c3.close();
//
//                data2 = new JSONObject();
//                data2.put("username", username);
//                data2.put("u_c", u_c);
//                data2.put("appid", appid);
//                data2.put("user_id", userId);
//
//            } catch (Exception e) {
//                ////e.printStackTrace()();
//            }
//
//            MySharedPreferences prefs = sqlitewraper.getSecureShared("mypre2");
//            String roleid = prefs.getString("authroleidn", "0");
//            String companyFeatureid = prefs.getString("authcompanyfid", "0");
//
//
//            httpGet.addHeader("auth1", data2.toString());
//            httpGet.addHeader("uname", username);
//            httpGet.addHeader("u_c", u_c);
//            httpGet.addHeader("user_id", userId);
//            httpGet.addHeader("Role_Id", roleid);
//            httpGet.addHeader("Company_Feature_Id", companyFeatureid);
//
//            HttpResponse response = client.execute(httpGet);
//            StatusLine statusLine = response.getStatusLine();
//            int statusCode = statusLine.getStatusCode();
//
//            if (statusCode != 200) {
//                k = 0;
//                return k;
//
//            }
//
//            if (statusCode == 200) {
//                HttpEntity entity = response.getEntity();
//                InputStream content = entity.getContent();
//                Reader streamReader = new InputStreamReader(content);
//
//                JsonReader reader = new JsonReader(streamReader);
//                reader.setLenient(true);
//
//
//                try {
//
//                    while (reader.hasNext() && (!(reader.peek() == JsonToken.END_DOCUMENT))) {
//
//                        if (!(reader.peek() == JsonToken.END_DOCUMENT)) {
//                            reader.beginObject();
//                            String parent_id = reader.nextName();
//                            if (parent_id.equals("parent_flow_id")) {
//                                parent_flow_id = reader.nextInt();
//                            }
//                            String sub_id = reader.nextName();
//
//                            if (sub_id.equals("sub_flow_id")) {
//                                subflow_id = reader.nextInt();
//                            }
//
//                            String ref_task_id = reader.nextName();
//                            int ref_id = -3;
//                            if (ref_task_id.equals("ref_task_id")) {
//                                ref_id = reader.nextInt();
//                            }
//                            String name = reader.nextName();
//                            if (name.equals("table_type")) {
//
//
//                                //table type Under-standing
//
//
//
//                                String table_type = reader.nextString();
//                                String millisecond_val = "0";
//                                String id_val = "";
//                                String id_n = reader.nextName();
//                                if (id_n.equals("id")) {
//                                    id_val = reader.nextString();
//                                }
//
//                                String millisecond = reader.nextName();
//
//                                if (millisecond.equals("millisecond")) {
//                                    millisecond_val = reader.nextString();
//
//                                }
//                                String alldata = reader.nextName();
//
//
//                                //Only Table Type 0,1 will come from server side
//
//                                //table_type=0 main task
//                                //table type=1 sub task
//
//
//                                if (alldata.equals("alldata")) {
//                                    String task_data = reader.nextString();
//
//                                    if (table_type.equals("-1")) {
//                                        k = 2;
//                                    }
//
//                                    if (table_type.equals("6")) {
////                                        Not called for New Download Structure
//                                        updateTaskDown(ref_id, "0", 0, 0);
//                                        k = 2;
//                                    }
//                                    if (table_type.equals("0") || table_type.equals("2")) {
//                                        //insert into task master
//
//                                        k = insertIntoTaskmaster(task_data, "task_master", id, millisecond_val, table_type, id_val, flow_id);
//                                        if (table_type.equals("2")) {
//                                            //update task download
////                                            Not called for New Download Structure
//                                            updateTaskDown(ref_id, "0", parent_flow_id, subflow_id);
//
//                                        }
//                                    }
//
//                                    if (table_type.equals("1") || table_type.equals("3")) {
//                                        k = insertIntoQuestionlog(task_data, table_type, id_val, millisecond_val, id, flow_id);
//                                        if (table_type.equals("3")) {
////                                            Not called for New Download Structure
//                                            updateTaskDown(ref_id, "0", parent_flow_id, subflow_id);
//                                        }
//                                    }
//
//                                    if (table_type.equals("5")) {
//                                        updateTaskDown(ref_id, "1", 0, 0);
//                                        k = 2;
//                                    }
//                                }
//
//                                reader.endObject();
//                            }
//                        } else {
//                            reader.close();
//                            reader = null;
//                            streamReader.close();
//
//                        }
//
//
//                    }
//                    reader.close();
//                    streamReader.close();
//
//                    //Download Question log parellel with task download.
//                    if (taskdownloadflag != 0) {
//                        k = 1;
//                        Intent i_ch = new Intent(sqlitewraper.context,
//                                DowoloadQuestionLogService.class);
//                        WakefulIntentService.sendWakefulWork(sqlitewraper.context,
//                                i_ch);
//                    }
//                } catch (Exception e) {
//                    if (reader != null) {
//                        reader.close();
//                    }
//                    streamReader.close();
//                }
//            }
//        } catch (Exception e) {
//            ////e.printStackTrace()();
//            return k;
//
//        }
//
//        return k;
//    }

    //update task download to userDefine flow master(Not called for New Download Structure)
    private void updateTaskDown(int sid, String down, int parent_id, int sub_id) {

        String t = "server_task_id=" + sid + " OR p_server_task_id=" + sid;
        ContentValues c = new ContentValues();
        c.put("is_down_complete", down);
        long temp12 = database.update(
                "task_master", c, t, null);

        if (parent_id != sub_id) {
            Cursor c1 = database.rawQuery("select main_sid,task_millisecond,sub_sid,sub_task_millisecond,main_que_id,main_que_millisecond,sub_que_id,sub_que_millisecond from User_Define_Flow_Master where flow_id=" + parent_id, null);
            c1.moveToFirst();
            if (c1.getCount() > 0) {

                String sub_sid = c1.getString(2);
                String sub_task_millisecond = c1.getString(3);
                String sub_que_id = c1.getString(6);
                String sub_que_millisecond = c1.getString(7);

                String t1 = "flow_id=" + sub_id;
                ContentValues c12 = new ContentValues();
                c12.put("main_sid", sub_sid);
                c12.put("task_millisecond", sub_task_millisecond);
                c12.put("main_que_id", sub_que_id);
                c12.put("main_que_millisecond", sub_que_millisecond);

                long temp123 = database.update(
                        "User_Define_Flow_Master", c12, t1, null);
            }
            cursorClose(c1);
        }
    }

    private int insertIntoTaskmaster(String restext, String d, int id, String miliis, String type, String id_val, int flow_id) throws Exception {
        int k = 0;

        try {
            JSONArray jsonArray = new JSONArray(restext);
            int legnth = jsonArray.length();

            String status1;
            String message;
            int server_task_id = 0, p_server_task_id, user_id, inspect_count = 0, checksheetid, step, status, c_type = 0, c_id = 0, tid, Task_c_type = 0, Task_c_id = 0;


            String username, Task_step = null, siteid, site_name, site_address, survey_date, display_siteid, cust_step = null, upload_date, updateddate = "", millisecond, end_of_date = "", data, tower_type = "", moduleid, module_name, moduledef = null, srnumber, global_var, CustomerData = null, Dynamic_Globalvar = null, punchFlag = null, inMs = null, outMs = null, durationPunch = null;
            float rate = 0, percentage = 0, lat, lon, height = 0;
            for (int k1 = 0; k1 < jsonArray.length(); k1++) {
                JSONObject jsonObject = jsonArray.getJSONObject(0);
                status1 = jsonObject.getString("status");
                message = jsonObject.getString("message");

                if (status1.equalsIgnoreCase("1")) {

                    JSONArray innerdata = new JSONArray(message);
                    int length = innerdata.length();
                    for (int j = 0; j < length; j++) {
                        JSONObject innerdatobj = innerdata.getJSONObject(j);


                        String imei = DeviceEventsUtils.getImei();
                        long time = new Date().getTime();
                        String task_id = imei + "_" + time;

                        server_task_id = innerdatobj.getInt("id");
                        user_id = innerdatobj.getInt("user_id");

                        Log.d("##TASK_DOWNLOAD", String.valueOf(server_task_id));

                        p_server_task_id = innerdatobj.getInt("parent_task_id");

//                        Log.d("##TASKISSUE","Servertaskid = "+server_task_id+", parentservertaskid = "+p_server_task_id);
                        username = innerdatobj.getString("username");
                        rate = (float) innerdatobj.getDouble("rate");
                        siteid = innerdatobj.getString("siteid");
                        site_name = innerdatobj.getString("site_name");
                        site_address = innerdatobj.getString("site_address");
                        survey_date = innerdatobj.getString("survey_date");
                        lat = (float) innerdatobj.getDouble("site_lat");
                        lon = (float) innerdatobj.getDouble("site_long");
                        checksheetid = innerdatobj.getInt("checksheet_id");
                        display_siteid = innerdatobj
                                .getString("display_siteid");
//                        step = innerdatobj.getInt("step");
                        step = 0;
                        status = innerdatobj.getInt("status");
                        upload_date = innerdatobj.getString("upload_date");
                        millisecond = innerdatobj.getString("millisecond");
                        data = innerdatobj.getString("data");
                        moduleid = innerdatobj.getString("moduleid");
                        module_name = innerdatobj.getString("module_name");
                        moduledef = innerdatobj.getString("moduledef");
                        srnumber = innerdatobj.getString("srnumber");
                        global_var = innerdatobj.getString("global_var");

                        cust_step = innerdatobj.getString("Cust_step");
                        c_type = innerdatobj.getInt("Cust_c_type");
                        c_id = innerdatobj.getInt("Cust_c_id");
                        CustomerData = innerdatobj.getString("CustomerData");

                        Task_step = innerdatobj.getString("Task_step");
                        Task_c_type = innerdatobj.getInt("Task_c_type");
                        Task_c_id = innerdatobj.getInt("Task_c_id");
                        String taskdata = innerdatobj.getString("taskdata");


                        if (innerdatobj.has("Dynamic_Globalvar")) {
                            Dynamic_Globalvar = innerdatobj.getString("Dynamic_Globalvar");
                        }

                        if (innerdatobj.has("punch_flag")) {

                            punchFlag = innerdatobj.getString("punch_flag");

                        }
                        if (innerdatobj.has("in_ms")) {

                            inMs = innerdatobj.getString("in_ms");

                        }
                        if (innerdatobj.has("out_ms")) {

                            outMs = innerdatobj.getString("out_ms");

                        }
                        if (innerdatobj.has("duration")) {

                            durationPunch = innerdatobj.getString("duration");

                        }

                        if (id != -3 && type.equals("0")) {
//                            updateUserDefineFlow(flow_id, "main_sid", id_val, "task_millisecond", millisecond);
                            updateLoginMillisecondsAndId("main_id", id_val, "main_milli", millisecond);
                        }

                        if (id != -3 && type.equals("2")) {
//                            updateUserDefineFlow(flow_id, "sub_sid", String.valueOf(server_task_id), "sub_task_millisecond", millisecond);
                            updateLoginMillisecondsAndId("sub_id", String.valueOf(server_task_id), "sub_milli", millisecond);

                        }


                        //insert and update into task_master
                        Cursor c1 = database.rawQuery(
                                "select status from task_master where server_task_id='"
                                        + server_task_id + "'", null);

                        if (c1.getCount() > 0) {
                            c1.moveToFirst();

                            int status_or = c1.getInt(0);

                            updateTaskMaster(server_task_id, user_id,
                                    username, rate, siteid, site_name,
                                    site_address, percentage, survey_date, lat,
                                    lon, inspect_count, checksheetid, height,
                                    display_siteid, step, status, upload_date,
                                    updateddate, millisecond, end_of_date,
                                    data, tower_type, moduleid, module_name,
                                    moduledef, srnumber, global_var,
                                    "task_master", 0, d, p_server_task_id, status_or, Dynamic_Globalvar, punchFlag, inMs, outMs, durationPunch);

                        } else {
                            ContentValues cv1 = new ContentValues();

                            cv1.put("task_id", task_id);
                            cv1.put("server_task_id", server_task_id);
                            cv1.put("flag", "0");
                            cv1.put("user_id", user_id);
                            cv1.put("username", username);
                            cv1.put("rate", rate);
                            cv1.put("p_server_task_id", p_server_task_id);
                            cv1.put("siteid", siteid);
                            cv1.put("site_name", site_name);
                            cv1.put("site_address", site_address);
                            cv1.put("percentage", percentage);
                            cv1.put("survey_date", survey_date);
                            cv1.put("lat", lat);
                            cv1.put("long", lon);
                            cv1.put("inspect_count", inspect_count);
                            cv1.put("checksheetid", checksheetid);
                            cv1.put("height", height);
                            cv1.put("display_siteid", display_siteid);
                            cv1.put("step", step);
                            cv1.put("status", status);
                            cv1.put("upload_date", upload_date);
                            cv1.put("updateddate", updateddate);
                            cv1.put("millisecond", millisecond);
                            cv1.put("end_of_date", end_of_date);
                            cv1.put("data", data);
                            cv1.put("tower_type", tower_type);
                            cv1.put("moduleid", moduleid);
                            cv1.put("module_name", module_name);
                            cv1.put("moduledef", moduledef);
                            cv1.put("srnumber", srnumber);
                            cv1.put("global_var", global_var);
                            cv1.put("site_flag", "0");
                            cv1.put("server_task_flag", "0");
                            cv1.put("display_siteid", display_siteid);
                            cv1.put("is_down_complete", "0");
                            cv1.put("Dynamic_Globalvar", Dynamic_Globalvar);


                            if (!punchFlag.equals("NA")) {

                                cv1.put("punch_flag", punchFlag);
                            }

                            if (!inMs.equals("NA")) {

                                cv1.put("in_ms", inMs);
                            }

                            if (!outMs.equals("NA")) {

                                cv1.put("out_ms", outMs);
                            }

                            if (!durationPunch.equals("NA")) {

                                cv1.put("duration", durationPunch);
                            }


                            long temp = database.insert("task_master", null,
                                    cv1);

                            Log.d("##TASK_DOWNLOADINSERT","TEMP ID:"+temp+"SID:"+server_task_id);

                            //insert data into task_master_history
                            insertTaskmasterHistory(null, task_id, server_task_id, user_id, username, rate, siteid, site_name, site_address, percentage, survey_date, lat, lon,
                                    inspect_count, checksheetid, height, display_siteid, step, status, upload_date, updateddate, millisecond, end_of_date, data, tower_type,
                                    moduleid, module_name, moduledef, srnumber, global_var, punchFlag, inMs, outMs, durationPunch, 0);


                        }
                        c1.close();
                        if (type.equals("0") || type.equals("2")) {
                            if (u_id != id) {
                                u_id = id;
                                counterTaskMaster = 1;
                            } else {
                                counterTaskMaster++;
                            }
                            Log.d("##TASK_COUNTER:", String.valueOf(counterTaskMaster));
                        }
                        if (id != -3) {
                            String t1;
                            t1 = "_id = 2";
                            ContentValues cv2 = new ContentValues();
                            cv2.put("counter", counterTaskMaster);
                            long temp11 = database.update("download_counter", cv2,
                                    t1, null);

                            taskdownloadflag = counterTaskMaster;

                            generateNotification(2, getFlowName(Integer.parseInt(moduleid)));
                        }

                        flagTaskMaster = 0;

                        //insert Downloaded Checksheet  Data To f_master
                        if (c_type == 3) {
                            downloadCustomerDataNew(CustomerData, "", "",
                                    cust_step, c_type, c_id, server_task_id,
                                    status1);
                        }
                        if (Task_c_type == 5) {
                            downloadSiteDataNew(taskdata, "", "", Task_step,
                                    Task_c_type, Task_c_id, server_task_id, status1);
                        }
                    }

                    k = 1;

                }
                if (status1.equalsIgnoreCase("2")) {

                    String t1;
                    t1 = "_id = 2";
                    ContentValues cv2 = new ContentValues();
                    cv2.put("counter", 0);
                    long temp11 = database.update("download_counter", cv2,
                            t1, null);

                    String t2;
                    t2 = "_id = 2";
                    ContentValues cv3 = new ContentValues();
                    cv3.put("total_count", 0);
                    long temp = database.update("download_counter", cv3,
                            t2, null);

                    k = 2;

                }

            }

        } catch (Exception e) {
            k = 0;
            if (d.equals("task")) {
                k = 1;
            }
            // TODO: handle exception
        }
        return k;
    }

    private void updateUserDefineFlow(int id, String id_coname, String id_val, String milli_columname, String millisecond) throws Exception {

        String t2 = "flow_id=" + id;
        ContentValues cv3 = new ContentValues();
        cv3.put(id_coname, id_val);
        cv3.put(milli_columname, millisecond);

        long temp12 = database.update(
                "User_Define_Flow_Master", cv3, t2, null);


    }

    private void updateLoginMillisecondsAndId(String id_coname, String id_val, String milli_columname, String millisecond) {


        ContentValues cv3 = new ContentValues();
        cv3.put(id_coname, id_val);
        cv3.put(milli_columname, millisecond);

        long temp12 = database.update(
                "Login_Master", cv3, null, null);

    }


    private int insertIntoQuestionlog(String f_data, String type, String id_val, String millisecond, int id, int flow_id) {
        int k = 0;
        int server_task_id = -4, c_id = 0, c_type = 0;
        String data = "", step = "", milli = "", question_log_id = "";
        try {
            String status1;
            String message;

            JSONArray j = new JSONArray(f_data);
            for (int k1 = 0; k1 < j.length(); k1++) {
                JSONObject jsonObject = j.getJSONObject(0);
                int tid = 0;
                status1 = jsonObject.getString("status");
                message = jsonObject.getString("message");

                if (status1.equals("1")) {
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

                                updateUserDefineFlow(flow_id, "main_que_id", question_log_id, "main_que_millisecond", milli);
                            }

                            if (type.equals("3")) {
                                updateUserDefineFlow(flow_id, "sub_que_id", question_log_id, "sub_que_millisecond", milli);
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
            }
        } catch (Exception e) {
            k = 1;
            return k;
        }
        return k;

    }


    private void updateTaskMaster(Integer server_task_id, Integer user_id,
                                  String username, Float rate, String siteid, String site_name,
                                  String site_address, Float percentage, String survey_date,
                                  Float lat, Float lon, Integer inspect_count, Integer checksheetid,
                                  Float height, String display_siteid, Integer step, Integer status,
                                  String upload_date, String updateddate, String millisecond,
                                  String end_of_date, String data, String tower_type,
                                  String moduleid, String module_name, String moduledef,
                                  String srnumber, String global_var, String t_name, int i, String d,
                                  int p_server_task_id, int status_or, String Dynamic_Globalvar, String punchFlag, String inMs, String outMs, String durationPunch) {
        String t2;
        t2 = "server_task_id='" + server_task_id + "'";
        ContentValues cv1 = new ContentValues();

        // cv1.put("flag", "0");
        cv1.put("p_server_task_id", p_server_task_id);
        cv1.put("user_id", user_id);
        cv1.put("username", username);
        cv1.put("rate", rate);  //uncommented for atc only
        cv1.put("siteid", siteid);
        cv1.put("site_name", site_name);
        cv1.put("site_address", site_address);
        cv1.put("percentage", percentage);
        cv1.put("survey_date", survey_date);
        cv1.put("lat", lat);
        cv1.put("long", lon);
        cv1.put("inspect_count", inspect_count);
        cv1.put("checksheetid", checksheetid);
        cv1.put("height", height);
        cv1.put("display_siteid", display_siteid);
        cv1.put("step", step);
        cv1.put("status", status);
        cv1.put("upload_date", upload_date);
        cv1.put("updateddate", updateddate);
        cv1.put("millisecond", millisecond);
        cv1.put("upload_date", upload_date);
        cv1.put("end_of_date", end_of_date);
        cv1.put("tower_type", tower_type);
        cv1.put("moduleid", moduleid);
        cv1.put("module_name", module_name);
        cv1.put("moduledef", moduledef);
        if (status_or != status) {
            cv1.put("srnumber", "1");
        }
        cv1.put("global_var", global_var);
        cv1.put("site_flag", "0");
        cv1.put("server_task_flag", "0");
        cv1.put("Dynamic_Globalvar", Dynamic_Globalvar);

        //----------------punch-------------//
        cv1.put("punch_flag", punchFlag);
        cv1.put("in_ms", inMs);
        cv1.put("out_ms", outMs);
        cv1.put("duration", durationPunch);


        ContentValues cv2 = new ContentValues();
        cv2.put("user_id", user_id);
        cv2.put("username", username);
        cv2.put("server_task_id", server_task_id);
        cv2.put("moduleid", moduleid);



        long temp = 0;
        try {

            if (d.equalsIgnoreCase("task_master")) {

                // Update task  if server status and millisecond is ot same
                Boolean istaskupdate = millisecondCheck(millisecond, status, server_task_id);

                if (istaskupdate)
                    temp = database.update(t_name, cv1, t2, null);

                Log.d("##TASK_DOWNLOADUPDATE","TEMP ID:"+temp+"SID:"+server_task_id);
            } else {
                //Call the web service to swap the task to server side
                temp = database.update(t_name, cv2, t2, null);
                JSONObject data1 = new JSONObject();
                data1.put("server_task_id", server_task_id);
                String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data1, WCFURL, DownloadConstant.METHOD_TASKUPDATE_USERSWAP);

            }
        } catch (Exception e) {
            e.printStackTrace();
        }


    }


    private void insertTaskmasterHistory(String tid_n, String task_id, int server_task_id, int user_id, String username, float rate, String siteid,
                                         String site_name, String site_address, float percentage, String survey_date, float lat, float lon,
                                         int inspect_count, int checksheetid, float height, String display_siteid, int step, int status, String upload_date, String updateddate,
                                         String millisecond, String end_of_date, String data, String tower_type, String moduleid, String module_name, String moduledef,
                                         String srnumber, String global_var, String punchFlag, String inMs, String outMs, String durationPunch, int tid) {

        android.database.Cursor cmax = database
                .rawQuery(
                        "SELECT tid  FROM  task_master WHERE tid = (SELECT MAX(tid) FROM task_master);",
                        null);

        if (cmax.getCount() > 0) {
            cmax.moveToFirst();
            tid_n = cmax.getString(0);
        }
        cmax.close();

        ContentValues c = new ContentValues();
        c.put("tid", tid_n);
        c.put("task_id", task_id);
        c.put("server_task_id", server_task_id);
        c.put("flag", "2");
        c.put("user_id", user_id);
        c.put("username", username);
        c.put("rate", rate);
        c.put("siteid", siteid);
        c.put("site_name", site_name);
        c.put("site_address", site_address);
        c.put("percentage", percentage);
        c.put("survey_date", survey_date);
        c.put("lat", lat);
        c.put("long", lon);
        c.put("inspect_count", inspect_count);
        c.put("checksheetid", checksheetid);
        c.put("height", height);
        c.put("display_siteid", display_siteid);
        c.put("step", step);
        c.put("status", status);
        c.put("upload_date", upload_date);
        c.put("updateddate", updateddate);
        c.put("millisecond", millisecond);
        c.put("end_of_date", end_of_date);
        c.put("data", data);
        c.put("tower_type", tower_type);
        c.put("moduleid", moduleid);
        c.put("module_name", module_name);
        c.put("moduledef", moduledef);
        c.put("srnumber", srnumber);
        c.put("global_var", global_var);
        //-----------punch--------//
        c.put("punch_flag", punchFlag);
        c.put("in_ms", inMs);
        c.put("out_ms", outMs);
        c.put("duration", durationPunch);
        c.put("local_milli", System.currentTimeMillis());
        c.put("entry_type", "and_download");


        android.database.Cursor c2_n = database.rawQuery(
                "Select * from task_master_history where status= " + status
                        + "  and tid=" + tid, null);
        c2_n.moveToFirst();

        if (c2_n.getCount() > 0) {

            String t;
            int tid_new = c2_n.getInt(0);
            t = "tid_n=" + tid_n;
            long temp = database.update("task_master_history", c, t, null);
            Log.d("##temp", String.valueOf(temp));

        } else {
            long temp = database.insert("task_master_history", null, c);
            Log.d("##temp1", String.valueOf(temp));
        }
        c2_n.close();
    }

    private void downloadCustomerDataNew(String f_data, String f_name, String flag,
                                         String step, int c_type, int c_id, int server_task_id,
                                         String status1) {

        int tid = 0;
        try {

            Cursor c3 = database.rawQuery(
                    "select  tid from task_master where server_task_id="
                            + server_task_id, null);

            c3.moveToFirst();
            if (c3.getCount() > 0) {
                tid = c3.getInt(0);
            }
            cursorClose(c3);

            if (status1.equalsIgnoreCase("1")) {

                ContentValues c = new ContentValues();
                c.put("f_data", f_data);
                c.put("tid", tid);
                c.put("f_name", f_name);
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
                update_f(tid, "");

                cursorClose(c1);
            }

            if (status1.equalsIgnoreCase("2")) {
                {
                    update_f(tid, "");
                }
            }

        } catch (Exception e) {
            // TODO Auto-generated catch block
        }

    }

    private void update_f(int tid, String siteid) {
        String t1;
        ContentValues args = new ContentValues();
        t1 = "tid=" + tid;
        args.put("site_flag", "1");
        long temp = database.update("task_master", args, t1, null);
    }

    private void downloadSiteDataNew(String f_data, String f_name, String flag,
                                     String step, int c_type, int c_id, int server_task_id,
                                     String status1) {
        int k = 0;
        int tid = 0;
        Cursor c3 = database.rawQuery(
                "select  tid from task_master where server_task_id="
                        + server_task_id, null);

        c3.moveToFirst();
        if (c3.getCount() > 0) {
            tid = c3.getInt(0);
        }
        cursorClose(c3);

        try {
            if (status1.equalsIgnoreCase("1")) {
                ContentValues c = new ContentValues();
                c.put("f_data", f_data);
                c.put("tid", tid);
                c.put("f_name", f_name);
                c.put("flag", "1");
                c.put("step", step);
                c.put("c_type", c_type);
                c.put("c_id", c_id);
                c.put("f_key", "0");
                c.put("f_value", c_id);

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

                cursorClose(c1);

                update(tid, server_task_id);
            }
            if (status1.equalsIgnoreCase("2")) {
                {
                    update(tid, server_task_id);
                }
            }

        } catch (Exception e) {
            k = 0;
            return;
        }
        k++;
    }

    public void update(int tid, int server_task_id) {
        String t1;
        ContentValues args = new ContentValues();
        t1 = "tid=" + tid + " and server_task_id=" + server_task_id;
        args.put("server_task_flag", "1");
        long temp = database.update("task_master", args, t1, null);
    }

    private Boolean millisecondCheck(String server_milliseond, int server_status, int s_taskid) {

        Boolean value;
        String local_millisecond = null, local_status = null, s_status = null;

        Cursor c10 = database
                .rawQuery(
                        "SELECT millisecond,status FROM  task_master WHERE server_task_id ='" + s_taskid + "'",
                        null);

        if (c10.getCount() > 0) {
            c10.moveToFirst();
            local_millisecond = c10.getString(0);
            local_status = c10.getString(1);
        }
        c10.close();

        s_status = String.valueOf(server_status);

        value = !server_milliseond.equals(local_millisecond) || !s_status.equals(local_status);

        return value;
    }

    //will be called for task_download
    int taskMasterDownloadAfterUserSwap() {

        int k = 0;
        try {

            database = sqlitewraper.getDatabase();
            JSONObject data1 = new JSONObject();

            Cursor c3 = database.rawQuery("SELECT username,u_c FROM  Login_Master",
                    null);
            c3.moveToLast();
            String username = c3.getString(0);
            String u_c = c3.getString(1);

            cursorClose(c3);

            try {
                data1.put("user_name", username);
                data1.put("u_c", u_c);
            } catch (JSONException e) {
                // TODO Auto-generated catch block
            }

            String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data1, WCFURL, DownloadConstant.METHOD_TASKDOWNLOAD_AFTERUSERSWAP);
            k = insertIntoTaskmaster(restext, "task", -3, "0", "0", "0", 0);

        } catch (Exception e) {
            k = 1;
            writeLogToFile(e.getMessage(), "TASK_MASTER_NEW_DOWNLOAD");

        }
        return k;

    }

    private String getServerMilliFromLogin(){


        Cursor c3 = database
                .rawQuery(
                        "SELECT servermilli FROM Login_Master",
                        null);
        c3.moveToLast();
        String servermilli = c3.getString(0);
        cursorClose(c3);
        return servermilli;
    }

    //insert in to old_task_delete for deleting old data from database
    public void deleteoldtask(JSONArray jsonArray){

        for (int i = 0; i < jsonArray.length(); i++) {

            try{
                JSONObject innerdatobj = jsonArray.getJSONObject(i);
                int rollid = innerdatobj.getInt("role_id");
                int flow_id = innerdatobj.getInt("flow_id");
                int udf_id = innerdatobj.getInt("id");
                String data = innerdatobj.getString("data");
                Log.d("##DATA",data);

                android.database.Cursor c1 = database.rawQuery("select udf_id from delete_old_task where udf_id="+udf_id, null);
                c1.moveToLast();
                int tripflagCount = c1.getCount();

                if (tripflagCount>0){

                    database.execSQL("DELETE FROM delete_old_task WHERE udf_id="+udf_id);

                    JSONArray jsondata = new JSONArray(data);

                    for (int j = 0; j < jsondata.length(); j++) {

                        JSONObject jsonObject = jsondata.getJSONObject(j);

                        String surverymode = jsonObject.getString("survey_mode");

                        if(surverymode.equalsIgnoreCase("online")){
                            surverymode = "0";
                        }
                        if(surverymode.equalsIgnoreCase("offline")){
                            surverymode = "1";
                        }

                        String statusstring = jsonObject.getString("status");
                        JSONArray statusarray = new JSONArray(statusstring);

                        for (int k = 0; k < statusarray.length(); k++) {
                            String status = String.valueOf(statusarray.get(k));
                            ContentValues cv = new ContentValues();
                            cv.put("udf_id", udf_id);
                            cv.put("role_id", rollid);
                            cv.put("flow_id", flow_id);
                            cv.put("allowstatus", status);
                            cv.put("isoffline", surverymode);
                            long temp = database.insert("delete_old_task", null, cv);
                            Log.d("##DELETE_OLD_TASK", String.valueOf(temp));
                        }
                    }

                }else{
                    JSONArray jsondata = new JSONArray(data);

                    for (int j = 0; j < jsondata.length(); j++) {

                        JSONObject jsonObject = jsondata.getJSONObject(j);

                        String surverymode = jsonObject.getString("survey_mode");

                        if(surverymode.equalsIgnoreCase("online")){
                            surverymode = "0";
                        }
                        if(surverymode.equalsIgnoreCase("offline")){
                            surverymode = "1";
                        }

                        String statusstring = jsonObject.getString("status");
                        JSONArray statusarray = new JSONArray(statusstring);

                        for (int k = 0; k < statusarray.length(); k++) {
                            String status = String.valueOf(statusarray.get(k));
                            ContentValues cv = new ContentValues();
                            cv.put("udf_id", udf_id);
                            cv.put("role_id", rollid);
                            cv.put("flow_id", flow_id);
                            cv.put("allowstatus", status);
                            cv.put("isoffline", surverymode);
                            long temp = database.insert("delete_old_task", null, cv);
                            Log.d("##DELETE_OLD_TASK", String.valueOf(temp));

                        }
                    }
                }
                c1.close();
            }catch (Exception e){
                e.printStackTrace();
            }
        }
    }

    private JSONArray getListOfFlowID() {

        JSONArray jsonArray = new JSONArray();

        Cursor c1 = database.rawQuery("select DISTINCT flow_id from delete_old_task where isoffline = '1'", null);
        c1.moveToFirst();
        int flagCount = c1.getCount();
        if (flagCount > 0) {
            for (int i = 0; i < flagCount; i++) {
                String flowId = c1.getString(0);
                jsonArray.put(Integer.parseInt(flowId));
                c1.moveToNext();
            }
        }
        c1.close();
        return jsonArray;
    }



    //Threshold_New Download
    int thresholdnewDownload() {
        String restext = null;
        int k = 0;

        try {
            database = sqlitewraper.getDatabase();

            JSONObject data1 = data();

            Cursor c3 = database.rawQuery(
                    "SELECT appid,company_Id FROM Login_Master", null);
            c3.moveToFirst();
            String appid;
            String company_Id;
            int count = c3.getCount();
            try{
                if (count > 0) {
                    appid = c3.getString(0);
                    company_Id = c3.getString(1);


                    data1.put("company_Id",company_Id);
                }
            }catch (Exception e){
                e.printStackTrace();
            }
            c3.close();

            Cursor c2 = database.rawQuery(
                    "SELECT MAX(millisecond) FROM  Thresold_New ", null);

            try {
                if (c2.getCount() > 0) {
                    c2.moveToFirst();

                    String millisecond = c2.getString(0);

                    cursorClose(c2);

                    if (millisecond == null) {
                        data1.put("millisecond", 0);
                    } else {

                        data1.put("millisecond", millisecond);
                    }
                }
            } catch (JSONException e) {
                // TODO Auto-generated catch block
            }

            JSONArray jsds = new JSONArray();
            jsds.put(data1);

            String url = DownloadConstant.DOWNLOAD_URL + DownloadConstant.METHOD_THRESHOLD_NEW + "?Data=";
            String da = URLEncoder.encode(jsds.toString(), "UTF-8");
            url = url + da;

//            HttpResponse response = downloadWithStreming(url, data1);
//            if (response != null) {
//                k = insertIntoThreshold(response);
//            } else {
//                k = 1;
//            }

            Response response = downloadWithStremingokhhtp(url, data1,DownloadConstant.METHOD_THRESHOLD_NEW);

            if (response != null) {
                k = insertIntoThreshold(response);
            } else {
                k = 1;
            }
        } catch (Exception e) {
            e.printStackTrace();
            writeLogToFile(e.getMessage(), "Threshold_New_DOWNLOAD");
            // TODO: handle exception
        }
        return k;
    }


    private int insertIntoThreshold(Response response) {

        int d = 0;

        try {

            int statusCode = response.code();   // Replace getStatusCode()

            if (statusCode == 200) {

                InputStream content = response.body().byteStream();  // Replace getEntity().getContent()

                Reader streamReader = new InputStreamReader(content);
                JsonReader reader = new JsonReader(streamReader);
                reader.setLenient(true);

                try {

                    while (reader.hasNext() &&
                            (!(reader.peek() == JsonToken.END_DOCUMENT))) {

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

                            String str = "Status -"+ status1;
                            DeviceEventsUtils.showToast(str);

                            // ===== STATUS 2 =====
                            if (status1.equalsIgnoreCase("2")) {

                                generateNotification(5, null);
                                d = 2;
                            }

                            // ===== STATUS 1 =====
                            if (status1.equalsIgnoreCase("1")) {

                                JSONArray innerdata = new JSONArray(message);
                                int length = innerdata.length();

                                for (int j = 0; j < length; j++) {

                                    JSONObject innerdatobj = innerdata.getJSONObject(j);

                                    String speed = innerdatobj.getString("Speed");
                                    String millisecond = innerdatobj.getString("millisecond");
                                    String normal_acc = innerdatobj.getString("Normal_ACC");
                                    String normal_deacc = innerdatobj.getString("Normal_DEACC");
                                    String hard_acc = innerdatobj.getString("Hard_ACC");
                                    String hard_deacc = innerdatobj.getString("Hard_DEACC");
                                    String gap_milli = innerdatobj.getString("Gap_Milli");
                                    String speed_violation_time = innerdatobj.getString("Speed_Violation_Time");
                                    String territory = innerdatobj.getString("territory");
                                    String vehicle_type = innerdatobj.getString("vehicle_type");

                                    generateNotification(5, null);

                                    ContentValues cv1 = new ContentValues();
                                    cv1.put("speed", speed);
                                    cv1.put("millisecond", millisecond);
                                    cv1.put("normal_acc", normal_acc);
                                    cv1.put("normal_deacc", normal_deacc);
                                    cv1.put("hard_acc", hard_acc);
                                    cv1.put("hard_deacc", hard_deacc);
                                    cv1.put("gap_milli", gap_milli);
                                    cv1.put("speed_violation_time", speed_violation_time);
                                    cv1.put("territory", territory);
                                    cv1.put("vehicle_type", vehicle_type);

                                    long temp = database.insert("Thresold_New", null, cv1);
                                    counterThreshold++;

                                    d = 1;
                                }

                                flagThreshold = 0;
                            }

                            // ===== STATUS 5 =====
                            if (status1.equalsIgnoreCase("5")) {
                                d = 1;
                            }

                            reader.endObject();
                        }
                    }

                    reader.close();
                    streamReader.close();
                    content.close();

                } catch (Exception e) {
                    reader.close();
                    streamReader.close();
                    content.close();
                }

            } else {
                return 1;
            }

        } catch (Exception e) {
            d = 1;
        }

        return d;
    }



//    private int insertIntoThreshold(HttpResponse response) {
//
//        int d = 0;
//        try {
//            StatusLine statusLine = response.getStatusLine();
//            int statusCode = statusLine.getStatusCode();
//
//            if (statusCode == 200) {
//                HttpEntity entity = response.getEntity();
//                InputStream content = entity.getContent();
//                Reader streamReader = new InputStreamReader(content);
//                JsonReader reader = new JsonReader(streamReader);
//                reader.setLenient(true);
//                try {
//                    while (reader.hasNext() && (!(reader.peek() == JsonToken.END_DOCUMENT))) {
//
//                        String status1 = "";
//                        String message = "";
//
//                        if (!(reader.peek() == JsonToken.END_DOCUMENT)) {
//                            reader.beginObject();
//                            String status = reader.nextName();
//                            if (status.equals("status")) {
//                                status1 = reader.nextString();
//                            }
//                            String message1 = reader.nextName();
//                            if (message1.equals("message")) {
//                                message = reader.nextString();
//                            }
//
//                            if (status1.equalsIgnoreCase("2")) {
//
////                                String t1;
////                                t1 = "_id = 4";
////                                ContentValues cv2 = new ContentValues();
////
////                                cv2.put("status", "2");
////
////                                long temp12 = database.update("download_counter", cv2, t1,
////                                        null);
//
//                                generateNotification(5, null);
//                                d = 2;
//                            }
//
//                            if (status1.equalsIgnoreCase("1")) {
//                                JSONArray innerdata = new JSONArray(message);
//                                int length = innerdata.length();
//
//                                for (int j = 0; j < length; j++) {
//
//                                    JSONObject innerdatobj = innerdata.getJSONObject(j);
//
//                                    // int threshold_id = innerdatobj.getInt("threshold_id");
//                                    String speed = innerdatobj.getString("Speed");
//                                    String millisecond = innerdatobj.getString("millisecond");
//                                    String normal_acc = innerdatobj.getString("Normal_ACC");
//                                    String normal_deacc = innerdatobj.getString("Normal_DEACC");
//                                    String hard_acc = innerdatobj.getString("Hard_ACC");
//                                    String hard_deacc = innerdatobj.getString("Hard_DEACC");
//                                    String gap_milli = innerdatobj.getString("Gap_Milli");
//                                    String speed_violation_time = innerdatobj.getString("Speed_Violation_Time");
//                                    String territory = innerdatobj.getString("territory");
//                                    String vehicle_type = innerdatobj.getString("vehicle_type");
//
////                                    String t1;
////                                    t1 = "_id = 5";
////                                    ContentValues cv2 = new ContentValues();
////                                    cv2.put("counter", counterFlowMaster);
////                                    long temp1 = database.update("download_counter", cv2,
////                                            t1, null);
//
//                                    generateNotification(5, null); //Threshold downloading start show notification
//
////                                    Cursor c4 = database.rawQuery(
////                                            "SELECT * FROM  Thresold_New WHERE threshold_id ="
////                                                    + threshold_id, null);
////                                    c4.moveToFirst();
//
//                                    ContentValues cv1 = new ContentValues();
////                                    cv1.put("threshold_id", threshold_id);
//                                    cv1.put("speed", speed);
//                                    cv1.put("millisecond", millisecond);
//                                    cv1.put("normal_acc", normal_acc);
//                                    cv1.put("normal_deacc", normal_deacc);
//                                    cv1.put("hard_acc", hard_acc);
//                                    cv1.put("hard_deacc", hard_deacc);
//                                    cv1.put("gap_milli", gap_milli);
//                                    cv1.put("speed_violation_time", speed_violation_time);
//                                    cv1.put("territory", territory);
//                                    cv1.put("vehicle_type", vehicle_type);
//
//
////
////                                    if (c4.getCount() > 0) {
////                                        String t;
////                                        t = "threshold_id =" + threshold_id;
////
////                                        long temp = database.update("Thresold_New", cv1, t,
////                                                null);
////
////                                        if (!isFirsttime) {
////                                            counterThreshold++;
////                                        }
////
////                                    } else {
//
//                                    long temp = database.insert("Thresold_New", null,
//                                            cv1);
//                                    counterThreshold++;
//
////                                    }
//                                    d = 1;
//                                    // cursorClose(c4);
//                                }
//                                flagThreshold = 0;
//                            }
//
//                            if (status1.equalsIgnoreCase("5")) {
//                                d = 1;
//                            }
//
//                            Log.d("##QQ", reader.toString());
//                            reader.endObject();
//
//                        } else {
//                            reader.close();
//                            reader = null;
//                            streamReader.close();
//                        }
//                    }
//                    reader.close();
//                    streamReader.close();
//
////                    if (taskdownloadflag != 0) {
////                        return 1;
////                    }
//                } catch (Exception e) {
//                    reader.close();
//                    streamReader.close();
//                }
//            } else {
//                return 1;
//            }
//        } catch (Exception e) {
//            d = 1;
//        }
//        return d;
//    }
}
