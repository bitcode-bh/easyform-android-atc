package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

import com.google.gson.Gson;
import com.sky.atc.easyformse.FaceDetactionActivity;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.AttendanceTaskUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

// multiple attendance supervisor engineer (static taskchecksheetjson)
public class AttendancePlugin extends CordovaPlugin {

    private static final String TAG = "AttendancePlugin";
    CallbackContext callbackContext;
    static final int requestCode = 48121899;
    public static final String photoUrlKey = "photoUrlKey";
    public static final String photoNameKey = "photoNameKey";
    public static final String resultDataKey = "resultDataKey";
    public static final String WithoutTaskAttendanceKey = "WithoutTaskAttendanceKey";
    public String WithoutTaskAttendance;
    MySharedPreferences pref;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;
        JSONObject jsonObject = args.getJSONObject(0);
        pref = sqlitewraper.getSecureShared("MyPref");
        if (jsonObject != null) {
            try {
                TaskData mTaskData = new Gson().fromJson(jsonObject.getJSONObject("attendanceData").toString(), TaskData.class);
                try{
//                    get key without task create attendance
                     WithoutTaskAttendance = jsonObject.getString("WithoutTaskAttendance");
                }
                catch (Exception e)
                {
                     WithoutTaskAttendance = "false";
                }
//             if value true without create task fill attendance otherwise create task attendance
                if(WithoutTaskAttendance.equalsIgnoreCase("true"))
                {
                    String photoUrl = jsonObject.getString("photoUrl");
                    String photoName;
                    if (jsonObject.has("photoName")) {
                        photoName = jsonObject.getString("photoName");
                    } else {
                        photoName = mTaskData.getUserId() + System.currentTimeMillis() + ".jpeg";
                    }
                    if (photoName.isEmpty()) {
                        photoName = mTaskData.getUserId() + System.currentTimeMillis() + ".jpeg";
                    }
                    LogUtils.writeAttendanceLogToFile("AttendancePlugin :  mTaskData: " +
                            mTaskData.toString() + "\n" + "photoUrl :" + photoUrl
                            + "\n photoName : " + photoName, "AttendancePlugin");
                    return openFaceRecognizerActivity(sqlitewraper.context, mTaskData, photoUrl, photoName);
                }
                if (!AttendanceTaskUtil.isAttendanceDone(sqlitewraper.getDatabase(), mTaskData.getModuleId(), mTaskData.getModuleName(), mTaskData.getUsername(), mTaskData.getUserId(), "1")) {
                    String photoUrl = jsonObject.getString("photoUrl");
                    String photoName;
                    if (jsonObject.has("photoName")) {
                        photoName = jsonObject.getString("photoName");
                    } else {
                        photoName = mTaskData.getUserId() + System.currentTimeMillis() + ".jpeg";
                    }
                    if (photoName.isEmpty()) {
                        photoName = mTaskData.getUserId() + System.currentTimeMillis() + ".jpeg";
                    }
                    LogUtils.writeAttendanceLogToFile("AttendancePlugin :  mTaskData: " +
                            mTaskData.toString() + "\n" + "photoUrl :" + photoUrl
                            + "\n photoName : " + photoName, "AttendancePlugin");
                    return openFaceRecognizerActivity(sqlitewraper.context, mTaskData, photoUrl, photoName);
                } else {
                    callbackContext.error("Task is already created");
                    return false;
                }

            } catch (Exception e) {
                LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "AttendancePlugin");
                this.callbackContext.error("error: " + e.toString());
                return false;
            }
        } else {
            LogUtils.writeAttendanceLogToFile("jsonObject is null", "AttendancePlugin");
            this.callbackContext.error("error: jsonObject is null");
            return false;
        }
    }

    Boolean openFaceRecognizerActivity(Context context, TaskData mTaskData, String photoUrl, String photoName) {
        Intent faceRecognizerActivityIntent = new Intent(context, FaceDetactionActivity.class);
        faceRecognizerActivityIntent.putExtra(photoUrlKey, photoUrl);
        faceRecognizerActivityIntent.putExtra(photoNameKey, photoName);
        faceRecognizerActivityIntent.putExtra(WithoutTaskAttendanceKey,WithoutTaskAttendance);
        faceRecognizerActivityIntent.putExtra(AttendanceNotificationShow.taskDataKey,
                mTaskData);
        try {
            this.cordova.startActivityForResult(this, faceRecognizerActivityIntent, requestCode);//null pointer check in case package name was not found
            return true;
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "openFaceRecognizerActivity AttendancePlugin");
            this.callbackContext.error("error: " + e.toString());
            return false;
        }

    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == AttendancePlugin.requestCode && resultCode == Activity.RESULT_OK) {
            if (intent.getExtras() != null) {
                String status = null;
                try {
                    if (intent.getExtras().containsKey(resultDataKey)) {
                        if(WithoutTaskAttendance.equalsIgnoreCase("true"))
                        {
                            // pass detection image path in plugin success
                            status = pref.getString("detectionFilePath", null);
                            this.callbackContext.success(status);
                        }
                        else {
                            this.callbackContext.success("success");
                        }

                    } else {
                        LogUtils.writeAttendanceLogToFile("resultDataKey is not found ", "onActivityResult AttendancePlugin");
                        this.callbackContext.error("error:  resultDataKey is not found");
                    }
                } catch (Exception e) {
                    LogUtils.writeAttendanceLogToFile("Exception :" + e.toString(), "onActivityResult AttendancePlugin");
                    this.callbackContext.error("error:  " + e.toString());
                }
            } else {
                LogUtils.writeAttendanceLogToFile("error: intent.getExtras() is null " + intent.getExtras().toString(), "onActivityResult AttendancePlugin");
                this.callbackContext.error("error: intent.getExtras() is null " + intent.getExtras().toString());
            }
        } else {

            try{
                LogUtils.writeAttendanceLogToFile("error: resultCode is RESULT_CANCELED :: " + intent.getExtras().getString("errorMsg", ""), "onActivityResult AttendancePlugin");
                // this.callbackContext.error("error: resultCode is RESULT_CANCELED " + resultCode);
                if(intent.getExtras().getString("errorMsg").equalsIgnoreCase(""))
                {
                    // if error msg  null toast is not display
                }
                else {
                    Toast.makeText(context, intent.getExtras().getString("errorMsg", ""), Toast.LENGTH_LONG).show();
                }
                this.callbackContext.error("");
            }
            catch (Exception e)
            {
                this.callbackContext.error("");
            }

        }

    }

}
