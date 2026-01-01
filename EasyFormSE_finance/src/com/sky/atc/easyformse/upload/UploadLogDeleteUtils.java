package com.sky.atc.easyformse.upload;

import android.content.ContentValues;
import android.database.Cursor;

import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Log is not available on server so server validation handling Utils class
@StringFogIgnore
public class UploadLogDeleteUtils {


    private  SQLiteDatabase database = sqlitewraper.getDatabase();
    private int tidcntlog;
    private int deletetidcntlog;
    private int deletetidcntlog1;
    private ArrayList<String> logsteparray = new ArrayList<>();
    private ArrayList<String> deletesubjsonArray = new ArrayList<>();
    private JSONArray logjsonArray = new JSONArray();
    private HashMap<Integer, JSONArray> meMap = new HashMap<>();
    private JSONArray deletesublogjsonArray = new JSONArray();


    public int makeChecksheetTechnicianDeleteLog(String checkshhetid, String servertaksid, String stepno) {


        int tid = 0;
        try {

            Cursor c3 = database
                    .rawQuery(
                            "select tid from task_master where server_task_id='"
                                    + servertaksid + "' ", null);
            c3.moveToFirst();
            int k = c3.getCount();

            if (k > 0) {

                tid = c3.getInt(0);
            }

            c3.close();


            if (tidcntlog != tid) {

                tidcntlog = tid;
                logjsonArray = new JSONArray(new ArrayList<String>());
                logsteparray.clear();
            }


            JSONObject data1 = new JSONObject();

            Cursor c1 = database
                    .rawQuery(
                            "select c_name,c_type from checksheet where checksheetid='"
                                    + checkshhetid + "' ", null);

            c1.moveToFirst();

            String c_name = c1.getString(0);
            String c_type = c1.getString(1);
            c1.close();

            Cursor c2 = database
                    .rawQuery(
                            "select subcategory from checksheet where checksheetid='"
                                    + checkshhetid + "' and step='" + stepno + "' ", null);

            c2.moveToFirst();
            String chstep = c2.getString(0);
            c2.close();
            if (!logsteparray.contains(chstep)) {
                data1.put("c_name", c_name);
                data1.put("s_name", chstep);
                data1.put("checksheet_type", c_type);
                logjsonArray.put(data1);
                logsteparray.add(c_name);
                logsteparray.add(chstep);
            }

            ContentValues cv = new ContentValues();
            cv.put("is_delete_log", String.valueOf(logjsonArray));

            String t2 = "tid=" + tid;

            long temp = database.update(
                    "task_master", cv, t2, null);

        } catch (Exception e) {
            e.printStackTrace();
        }
        return tid;
    }


    public void statusUpdateDeleteLog(int tid, String oldStatus) {

        if (oldStatus == null) {

            Cursor c4 = database
                    .rawQuery("SELECT status FROM task_master_history WHERE tid='" + tid + "' ORDER BY tid_n desc LIMIT 1, 1", null);

            c4.moveToFirst();

            String status = "0";

            if (c4.getCount() > 0) {

                status = c4.getString(0);

            } else {

                Cursor c5 = database
                        .rawQuery("SELECT status FROM task_master_history WHERE tid='" + tid + "' ORDER BY tid_n desc LIMIT 0, 1", null);
                c5.moveToFirst();

                if (c5.getCount() > 0) {
                    status = c5.getString(0);
                }

                c5.close();
            }


//            String statustask = compareStatuswithTaskmaster(tid);
//
//            if (statustask.equalsIgnoreCase(status)) {
//                status = "0";
//            }

            DeviceEventsUtils.insert_task_master_revert("is_delete_log", status, tid);

            ContentValues cv2 = new ContentValues();
            cv2.put("status", status);
            String t3 = "tid='" + tid + "'";

            long temp2 = database.update(
                    "task_master", cv2, t3, null);

            parentStatusUpdateWithOldStatus(tid, oldStatus);

        } else {
            DeviceEventsUtils.insert_task_master_revert("is_delete_log", oldStatus, tid);
            ContentValues cv2 = new ContentValues();
            cv2.put("status", oldStatus);
            String t3 = "tid='" + tid + "'";

            long temp2 = database.update("task_master", cv2, t3, null);

            parentStatusUpdateWithOldStatus(tid, oldStatus);

        }

    }


    private void parentStatusUpdateWithOldStatus(int tid, String oldStatus) {


        JSONArray deletedmediaarray = null;

        Cursor cstatus = database
                .rawQuery(
                        "select p_tid,moduleid,module_name from task_master where ((server_task_id !='0' and p_tid is not null)) and tid='"
                                + tid + "' ", null);
        cstatus.moveToFirst();
        int j = cstatus.getCount();

        if (j > 0) {

            int pid = cstatus.getInt(0);
            String moduleid = cstatus.getString(1);
            String module_name = cstatus.getString(2);

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

//            String statustask = compareStatuswithTaskmaster(pid);
//
//            if (statustask.equalsIgnoreCase(status1)) {
//                status1 = "0";
//            }


            deletedmediaarray = deletedmedia(moduleid, module_name, pid);
            String value = String.valueOf(deletedmediaarray).replaceAll("\\\\", "");


            if (oldStatus == null) {

                DeviceEventsUtils.insert_task_master_revert("is_delete_sub", status1, tid);

                ContentValues cv2 = new ContentValues();
                cv2.put("status", status1);
                cv2.put("flag", 3);
                cv2.put("is_delete_sub", value);
                String t3 = "tid='" + pid + "'";

                long temp3 = database.update(
                        "task_master", cv2, t3, null);

            } else {

                DeviceEventsUtils.insert_task_master_revert("is_delete_sub", oldStatus, tid);

                ContentValues cv2 = new ContentValues();
                cv2.put("status", oldStatus);
                cv2.put("flag", 3);
                cv2.put("is_delete_sub", value);
                String t3 = "tid='" + pid + "'";

                long temp3 = database.update(
                        "task_master", cv2, t3, null);
            }

        } else {

            ContentValues cv3 = new ContentValues();
            cv3.put("flag", 3);
            String t4 = "tid='" + tid + "'";

            long temp3 = database.update(
                    "task_master", cv3, t4, null);
        }
    }

    public JSONArray deletedmedia(String module_id, String module_name, int p_id) {

        String maindeletejson = "";
        JSONObject obj = null;

        if (deletetidcntlog != p_id) {
            deletetidcntlog = p_id;
            deletesublogjsonArray = new JSONArray(new ArrayList<String>());
            deletesubjsonArray.clear();
        }

        JSONObject data2 = new JSONObject();

        if (!deletesubjsonArray.contains(module_id)) {

            try {
                data2.put("module_id", module_id);
                data2.put("module_name", module_name);
                deletesublogjsonArray.put(data2);
                deletesubjsonArray.add(module_id);
                deletesubjsonArray.add(module_name);

                JSONArray mapArray = null;
                if (meMap.containsKey(p_id)) {
                    mapArray = meMap.get(p_id);

                    if (deletetidcntlog1 != deletetidcntlog) {
                        deletetidcntlog1 = p_id;

                        if (!meMap.containsValue(deletesublogjsonArray)) {
                            deletesublogjsonArray.put(mapArray.toString());
                        }
                    }

                } else {
                    meMap.put(p_id, deletesublogjsonArray);
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return deletesublogjsonArray;
    }
}
