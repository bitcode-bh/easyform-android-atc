package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.context;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

import com.google.gson.Gson;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

// group attendance plugin use for group photo attendance
public class GroupAttendancePlugin extends CordovaPlugin {


    private static final String TAG = "GroupAttendancePlugin";
    CallbackContext callbackContext;
    static final int requestCode = 48121898;
    public static final String photoUrlKey = "photoUrlKey";
    public static final String photoNameKey = "photoNameKey";
    public static final String resultDataKey = "resultDataKey";
    public static final String WithoutTaskAttendanceKey = "WithoutTaskAttendanceKey";

    public static final String GroupAttendance = "GroupAttendance";
    public String WithoutTaskAttendance;
    MySharedPreferences pref;
    List<String> downloadedPaths ;
    String url;
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException
    {
        this.callbackContext = callbackContext;
        JSONObject jsonObject = args.getJSONObject(0);
        pref = sqlitewraper.getSecureShared("MyPref");

        if (jsonObject != null) {
            try {
                TaskData mTaskData = new Gson().fromJson(jsonObject.getJSONObject("attendanceData").toString(), TaskData.class);

                String photoUrl = jsonObject.getString("photoUrl");
                try {
//                    get key without task create attendance
                    WithoutTaskAttendance = jsonObject.getString("WithoutTaskAttendance");
                } catch (Exception e) {
                    WithoutTaskAttendance = "false";
                }
//                " [\"/storage/emulated/0/myDirectory/IMG1755608253788.jpeg\"  ,\"/storage/emulated/0/myDirectory/IMG12345678.jpg\"]"
                String GroupUrl ;
                if (photoUrl.equalsIgnoreCase("")) {
///storage/emulated/0/myDirectory/IMG1755608253788.jpeg\
                    GroupUrl = jsonObject.getString("group_photoUrl");
                    try {
                        JSONArray photoArray = new JSONArray(GroupUrl);
                        downloadedPaths = new ArrayList<>();
                        for (int i = 0; i < photoArray.length(); i++) {
                             url  = photoArray.getString(i);
//                                String fileName = new File(url).getName();
//                                String fullPath = Utils.getDownloadPathFile(this).getAbsolutePath() + "/" + fileName;

//                                startService(new Intent(this, ImageDownloadService.class)
//                                        .putExtra(ImageDownloadService.fromPluginKey, true)
//                                        .putExtra(ImageDownloadService.useridKey, mTaskData.getUserId())
//                                        .putExtra("imageUrl", url)
//                                        .putExtra("FileName", fileName));
                            downloadedPaths.add(url);
                        }

//                            waitForAllImageDownloads(photoArray, mTaskData.getUsername());
                         return openFaceRecognizerActivity(context,downloadedPaths);
                    }
                    catch (Exception e)
                    {
                        e.printStackTrace();
                    }

                    return true;
                }
            } catch (Exception e) {
                LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "GroupAttendancePlugin");
                this.callbackContext.error("error: " + e.toString());
                return false;
            }
        } else {
            LogUtils.writeAttendanceLogToFile("jsonObject is null", "GroupAttendancePlugin");
            this.callbackContext.error("error: jsonObject is null");
            return false;
        }
        return false;
    }

    Boolean openFaceRecognizerActivity(Context context, List<String> filePaths) {

        try {
            Intent intent = new Intent(context, Class.forName("com.nareshchocha.facerecognition.ui.activitys.GroupFaceRecognizerActivity"));
            intent.putStringArrayListExtra("imageFilePathList", new ArrayList<>(filePaths));
            this.cordova.startActivityForResult(this, intent, requestCode);//null pointer check in case package name was not found
            return true;
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "openFaceRecognizerActivity GroupAttendancePlugin");
            this.callbackContext.error("error: " + e.toString());
            return false;
        }

    }





    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == requestCode && resultCode == Activity.RESULT_OK) {
            if (intent.getExtras() != null) {
                String status = null;
                try {
                    String detectionFilePath = intent.getExtras().getString("detectionFilePath");
                    //status = pref.getString("detectionFilePath", null);
                    this.callbackContext.success(detectionFilePath);
                } catch (Exception e) {
                    LogUtils.writeAttendanceLogToFile("Exception :" + e.toString(), "onActivityResult GroupAttendancePlugin");
                    this.callbackContext.error("error:  " + e.toString());
                }
            } else {
                LogUtils.writeAttendanceLogToFile("error: intent.getExtras() is null " + intent.getExtras().toString(), "onActivityResult GroupAttendancePlugin");
                this.callbackContext.error("error: intent.getExtras() is null " + intent.getExtras().toString());
            }
        } else {

            try{
                LogUtils.writeAttendanceLogToFile("error: resultCode is RESULT_CANCELED :: " + intent.getExtras().getString("errorMsg", ""), "onActivityResult GroupAttendancePlugin");
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
                if(this.callbackContext != null) {
                    this.callbackContext.error("");
                }

            }

        }

    }
}
