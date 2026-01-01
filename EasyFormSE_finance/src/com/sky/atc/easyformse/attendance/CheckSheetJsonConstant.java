package com.sky.atc.easyformse.attendance;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Set Alarm for Notification
@StringFogIgnore
public class CheckSheetJsonConstant {

    static String getCheckSheetJSon() {
        return "[{\"item_id\":0,\"que_id\":0,\"type\":0,\"Excel_Header\":\"Task Form\",\"value\":[\"Task Form\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":0,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"\",\"class1\":[\"\"],\"misc_data\":[{\"type\":50,\"value\":\"\"}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]},{\"item_id\":1,\"que_id\":4,\"type\":20,\"Excel_Header\":\"UserName\",\"value\":[\"UserName\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":1,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"UserName\",\"class1\":[\"\"],\"misc_data\":[{\"type\":6,\"value\":[]}],\"value_new\":[{\"push_data\":[{\"push_array\":[],\"window_style\":\"popup\",\"view_style\":\"tableview\"}],\"Checksheet_id\":59295,\"columndata\":[],\"Fill_Data\":[],\"Target_Id\":\"USER_ID\",\"Target_Value\":\"UserName\",\"SearchID\":15707,\"SearchName\":\"UserName-1\"}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]},{\"item_id\":2,\"que_id\":7,\"type\":21,\"Excel_Header\":\"FlowName\",\"value\":[\"FlowName\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":1,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"FlowName\",\"class1\":[\"\"],\"misc_data\":[{\"type\":6,\"value\":[]}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]},{\"item_id\":3,\"que_id\":10,\"type\":8,\"Excel_Header\":\"\",\"value\":[\"AssignDate\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":1,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"AssignDate\",\"class1\":[\"\"],\"misc_data\":[{\"type\":50,\"value\":\"\"}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]},{\"item_id\":4,\"que_id\":15,\"type\":7,\"Excel_Header\":\"Face Detection Photo\",\"value\":[\"Face Detection Photo\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":1,\"valid\":\"true\",\"is_deleted\":0,\"is_hide\":\"false\",\"trigger_class\":\"\",\"name\":\"Face Detection Photo\",\"class1\":[\"\"],\"reference_class\":[],\"is_disabled\":\"false\",\"misc_data\":[{\"type\":6,\"value\":\"[{\\\"photo_type\\\":\\\"camera\\\",\\\"latlong\\\":\\\"false\\\",\\\"quality\\\":\\\"0\\\",\\\"width\\\":\\\"480\\\",\\\"height\\\":\\\"640\\\",\\\"view_label\\\":\\\"true\\\",\\\"target_class\\\":\\\"\\\",\\\"burstmode\\\":\\\"false\\\",\\\"old_photo_class\\\":\\\"\\\",\\\"car_check\\\":\\\"false\\\",\\\"scan_mode\\\":\\\"false\\\"}]\"}],\"is_reset\":\"false\",\"TASK_CREATION_TRIGGER\":\"\",\"reference_from_id\":0}],\"objectclass\":\"Select\",\"objectname\":\"\",\"Category_Id\":\"0\",\"objectfill\":\"label\",\"old_log\":\"false\",\"check_duplicate\":\"false\"},{\"item_id\":5,\"que_id\":8,\"type\":10,\"Excel_Header\":\"\",\"value\":[\"\"],\"ans\":[\"\"],\"prop\":[{\"searchkey\":0,\"valid\":\"true\",\"is_deleted\":0,\"name\":\"\",\"class1\":[\"\"],\"misc_data\":[{\"type\":50,\"value\":\"\"}],\"reference_from_id\":0}],\"dependency\":[{\"dep_type\":\"\",\"dep_ans\":\"\",\"dep_item_id\":\"\",\"dep_class\":\"\"}]}]";
    }

    //set alarm for different days
    public static void getNotificationTime(int timSlot, int dayCount, String dayString) {
        Log.d("getNotificationTime", "timSlot: " + timSlot + " dayCount: " + dayCount + " dayString" + dayString);

        try {
            JSONArray jsonArray = new JSONArray(dayString);
            JSONObject jsonObject = jsonArray.getJSONObject(0);
            JSONArray jsonArray1 = jsonObject.getJSONArray(String.valueOf(dayCount));
            AttendanceClass.setAlarmNotification(jsonArray1.getString(timSlot), dayCount, timSlot);

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
