package com.sky.atc.easyformse.download;

import android.content.ContentValues;
import android.util.Log;

import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

@StringFogIgnore
public class DownloadUtils {

    public static String getDeletetaskflag() {
        return deletetaskflag;
    }

    public static void setDeletetaskflag(String deletetaskflag) {
        DownloadUtils.deletetaskflag = deletetaskflag;
    }

    static String deletetaskflag;



    //DELETE OLD TASK LOGIC
    public static void insertdeleteoldtask() {

       SQLiteDatabase database = sqlitewraper.getDatabase();

        Cursor c2 = database.rawQuery(
                "SELECT f_id FROM User_Define_Flow_Master order by f_id asc",
                null);
        c2.moveToFirst();
        int count1 = c2.getCount();

        if (count1 > 0) {

            for (int i = 0; i < count1; i++) {

                int f_id = c2.getInt(0);
                Log.d("##FID", String.valueOf(f_id));

                Cursor c1 = database.rawQuery("select id,rollid,flow_id,data from User_Define_Flow_Master where f_id=" + f_id, null);

                c1.moveToFirst();

                int count = c1.getCount();
                if (count > 0) {

                    String udf_id = c1.getString(0);
                    String roll_id = c1.getString(1);
                    String flow_id = c1.getString(2);
                    String data = c1.getString(3);

                    try {
                        JSONArray jsondata = new JSONArray(data);

                        for (int j = 0; j < jsondata.length(); j++) {

                            JSONObject jsonObject = jsondata.getJSONObject(j);

                            String surverymode = jsonObject.getString("survey_mode");

                            if (surverymode.equalsIgnoreCase("online")) {
                                surverymode = "0";
                            }
                            if (surverymode.equalsIgnoreCase("offline")) {
                                surverymode = "1";
                            }

                            String statusstring = jsonObject.getString("status");
                            JSONArray statusarray = new JSONArray(statusstring);

                            for (int k = 0; k < statusarray.length(); k++) {
                                String status = String.valueOf(statusarray.get(k));
                                ContentValues cv = new ContentValues();
                                cv.put("udf_id", udf_id);
                                cv.put("role_id", roll_id);
                                cv.put("flow_id", flow_id);
                                cv.put("allowstatus", status);
                                cv.put("isoffline", surverymode);
                                long temp = database.insert("delete_old_task", null, cv);
                                Log.d("##DELETE_OLD_TASK", String.valueOf(temp));
                            }
                        }
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }


                }
                c2.moveToNext();
            }

        }

        c2.close();


    }

}
