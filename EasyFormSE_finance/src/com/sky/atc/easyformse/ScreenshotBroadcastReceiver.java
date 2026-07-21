package com.sky.atc.easyformse;


import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;


import com.sky.atc.easyformse.plugins.JitsiMeetingPlugin;
import com.sky.atc.easyformse.upload.UploadUtils;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Calendar;

public class ScreenshotBroadcastReceiver extends BroadcastReceiver {

    String jsonData;
    String photopath;
    String taskid;
    String photo_name;
    SQLiteDatabase database;
    private static long lastInsertTime = 0;
    public static final String JITSI_PLUGIN_BROADCAST_CLASS = "com.easyform.newjitsi.broadcasts.JitsiPluginBroadcast";
    String otherDataString;
    String loginUserDataString;
    String pluginArgsString;
    String notificationRemoteDataString;
    @Override
    public void onReceive(Context context, Intent intent) {


        if (intent.getAction().equalsIgnoreCase("com.easyfrom.jitsi.SCREENSHOT_SAVED")) {

            long now = System.currentTimeMillis();
            if (now - lastInsertTime < 1000) {
                Log.d("Receiver", "Duplicate insert avoided");
                return;
            }

            lastInsertTime = now;

            Bundle extras = intent.getExtras();


            if (extras != null) {
                photopath = extras.getString("screenshot_path");
                jsonData = extras.getString("jsonData");
                taskid = extras.getString("task_id");
                photo_name = extras.getString("photo_name");
                otherDataString  = extras.getString("OTHER_DATA");
                loginUserDataString  = extras.getString("LOGIN_USER_DATA");
                pluginArgsString = extras.getString("JITSI_MEETING_PLUGIN_ARGS");
                notificationRemoteDataString = extras.getString("NOTIFICATION_REMOTE_DATA");
                database = sqlitewraper.getDatabase();

                insert();
            }
        }

    }

    public void insert()
    {
        try {
//            JSONArray mJsonArray = new JSONArray(jsonData);
            JSONObject jsonObject = new JSONObject(jsonData);

            JSONArray screenshotArray = jsonObject.getJSONArray("screenshot");
            JSONObject mJsonObject = screenshotArray.getJSONObject(0);
            String ChecksheetId = mJsonObject.getString("checksheet_id");
            String question_id = mJsonObject.getString("que_id");

            ContentValues PMasterValues = new ContentValues();
            PMasterValues.put("tid", taskid);
            PMasterValues.put("checksheetid", ChecksheetId);
            PMasterValues.put("p_name", photo_name);
            PMasterValues.put("p_url", photopath);
            PMasterValues.put("millisecond", System.currentTimeMillis());
            PMasterValues.put("p_key", "1");
            PMasterValues.put("p_value", "image");
            PMasterValues.put("p_type", "image/jpg");
            PMasterValues.put("Ph_id", "0");
            PMasterValues.put("it_id", "0");
            PMasterValues.put("que_name", "Jitsi Photo");
            PMasterValues.put("que_id", question_id);
            PMasterValues.put("match_temp_id", "0");
            PMasterValues.put("flag", "0");

            long temp = database.insert("p_master", null, PMasterValues);
            Log.d("DEBUG", "Inserted record with que_id: " + question_id);
            upload_photo_call(taskid);
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "insertPMaster");
        }
    }

    public void upload_photo_call(String taskid)
    {
        Cursor c = database
                .rawQuery(
                        "select pid,p_name,p_url,p_key,p_value,p_type,it_id,que_id,checksheetid,millisecond,Ph_id,match_temp_id from p_master where flag='0' and  tid='"
                                + taskid + "' ", null);
        c.moveToFirst();
        int j = c.getCount();

        for (int i = 0; i < c.getCount(); i++) {
            try {
                int pid = c.getInt(0);
                String p_name = c.getString(1);
                String p_url = c.getString(2);
                String p_key = c.getString(3);
                String p_type = c.getString(5);
                String it_id = c.getString(6);
                int que_id = c.getInt(7);
                int p_checksheetid = c.getInt(8);
                String millisecond = c.getString(9);
                String ph_id = c.getString(10);

                File file = new File(p_url);
                long length = file.length() / 1024;

                if (length > 1024) {
                    p_url = UploadUtils.compressImage(p_url);
                    Log.d("##IMGRESIZE", p_url);
                }

                String s_pname = p_name + ".jpg";

                File imageFile;

                if (p_type.equalsIgnoreCase("png")) {
                    imageFile = new File(p_url);

                    String p_name1 = p_url
                            .substring(p_url.lastIndexOf("/") + 1);

                    p_name1.charAt(0);

                } else {
                    String p_name1 = p_url
                            .substring(p_url.lastIndexOf("/") + 1);
                    imageFile = new File(p_url);

                }

                BitmapFactory.Options options = new BitmapFactory.Options();
                options.inInputShareable = true;
                options.inPurgeable = true;


                ArrayList<String> utcmi = new ArrayList<>();
                utcmi = utcCalculationOffset(millisecond);
                String timezone = utcmi.get(1);
                String utcmilliseconds = utcmi.get(0);
//                Uri uri = Uri.parse(p_url);
//                String  realpath = uri.getPath();
//                realpath = realpath.replace("external_files", Environment.getExternalStorageDirectory().toString());
                FileInputStream fis = new FileInputStream(imageFile);

                Bitmap bitmap = BitmapFactory.decodeFileDescriptor(fis.getFD(),
                        null, options);
                ByteArrayOutputStream stream = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream);
                byte[] image = stream.toByteArray();
                String img_str = Base64.encodeBytes(image);

                JSONObject data1 = new JSONObject();
                data1.put("siteid", 0);
                data1.put("stepid", 0);
                data1.put("ques_id", que_id);
                data1.put("servertaskid", taskid);
                data1.put("inspectioncounter", 1);
                data1.put("check_type", p_checksheetid);
                data1.put("fileName", p_name);
                data1.put("buffer", img_str);
                data1.put("Ph_id", ph_id);
                data1.put("it_id", it_id);
                data1.put("timezone", timezone);
                data1.put("utcmilliseconds", utcmilliseconds);

                Cursor c3 = database.rawQuery(
                        "SELECT username,u_c,appid,devicetype,appversion FROM Login_Master", null);
                c3.moveToLast();
                String username = c3.getString(0);
                //		String u_c = c3.getString(1);
                B_new b = new B_new();
                String u_c = b.GetValue();
                String appid = c3.getString(2);

                String devicetype = c3.getString(3);
                String appversion = c3.getString(4);

                c3.close();

                JSONObject data2 = new JSONObject();
                data2.put("username", username);
                data2.put("u_c", u_c);
                data2.put("appid", appid);

                String companyID = DeviceEventsUtils.getLoginDetails().get(4);
                String u_c1 = b.GetValue();
                if(!u_c1.equalsIgnoreCase("NA"))
                {
                    int photoId = UploadUtils.uploadPhotoResumable(p_url, companyID, "0", String.valueOf(p_checksheetid), String.valueOf(que_id), String.valueOf(p_key), p_type, ph_id, it_id, p_url, taskid);
                    if (photoId > 0) {
                        update_pid(pid, "p_master", Integer.parseInt(taskid), millisecond);

                        Intent intent = new Intent(sqlitewraper.context,Class.forName(JITSI_PLUGIN_BROADCAST_CLASS));
//                        intent.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "PhotoId"); // use for send notification
                        intent.setAction(JitsiMeetingPlugin.JITSI_BASE_ACTION + "Get_PhotoId");
                        intent.putExtra("Photo_Id", photoId);
                        intent.putExtra("task_id", taskid);
                        intent.putExtra("Photo_name", p_name);
                        intent.putExtra("Photo_path",p_url);
                        intent.putExtra("Photo_size", UploadUtils.sizeofFile);
                        intent.putExtra("LOGIN_USER_DATA",loginUserDataString);
                        intent.putExtra("OTHER_DATA",otherDataString);
                        intent.putExtra("JITSI_MEETING_PLUGIN_ARGS",pluginArgsString);
                        intent.putExtra("NOTIFICATION_REMOTE_DATA",notificationRemoteDataString);
                        intent.putExtra("checksheet_id", String.valueOf(p_checksheetid));
                        intent.putExtra("que_id", String.valueOf(que_id));
                        sqlitewraper.context.sendBroadcast(intent);

                    }
                    else {

                        LogUtils.writeUploadLogToFile("UPLOAD_FAILED:","" ,"PHOTO_UPLOAD_RESUMABLE");
                    }
                }

            }
            catch (Exception e)
            {
                Log.d("Exception",e.toString());
            }
        }


    }
    // update flag with 1 on successful photo upload
    void update_pid(int id, String t_name, int tid, String millisecond) {
        String t1;
        t1 = "pid='" + id + "' and  tid='" + tid + "' and millisecond=" + millisecond;
        ContentValues v = new ContentValues();
        v.put("flag", "1");
        long temp = database.update(t_name, v, t1, null);
        temp++;
    }
    public ArrayList utcCalculationOffset(String millisecond) {

        ArrayList<String> arrayList = new ArrayList<>();

        long milliseconds = Long.parseLong(millisecond);

        Calendar rightNow = Calendar.getInstance();

        long offset = rightNow.get(Calendar.ZONE_OFFSET) +
                rightNow.get(Calendar.DST_OFFSET);

        long utcmilliseconds = milliseconds - offset;
        long zoneOffset = rightNow.get(Calendar.ZONE_OFFSET);

        String timezone = String.valueOf((zoneOffset));
        arrayList.add(String.valueOf(utcmilliseconds));
        arrayList.add(timezone.toString());
        return arrayList;
    }
}