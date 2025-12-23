package com.sky.atc.easyformse;


import static com.sky.atc.easyformse.sqlitewraper.context;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.StrictMode;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.attendanceutils.AttendanceTaskUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.ImageDownloadService;
import com.sky.atc.easyformse.download.utils.PreferencesKey;
import com.sky.atc.easyformse.download.utils.PreferencesUtil;
import com.sky.atc.easyformse.download.utils.Utils;
import com.sky.atc.easyformse.plugins.AttendancePlugin;
import com.sky.atc.easyformse.utils.LogUtils;


public class FaceDetactionActivity extends AppCompatActivity {

    TaskData mTaskData;
    String fullPath;
    boolean fromPlugin = false;
    String WithoutTaskAttendance;
    MySharedPreferences pref;
    String IsCheckInNoti;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        setContentView(R.layout.activity_face_detaction);
        Bundle mBundle = getIntent().getExtras();
        if(mBundle != null ) {
            WithoutTaskAttendance = mBundle.getString(AttendancePlugin.WithoutTaskAttendanceKey, "");
            IsCheckInNoti = mBundle.getString("IsCheckInNoti","false");
        }
        pref = sqlitewraper.getSecureShared("MyPref");
        try {
            if (mBundle != null && mBundle.containsKey(AttendanceNotificationShow.taskDataKey)) {
                mTaskData = (TaskData) mBundle.getSerializable(AttendanceNotificationShow.taskDataKey);
                if (mBundle.containsKey(AttendancePlugin.photoUrlKey) &&
                        mBundle.containsKey(AttendancePlugin.photoNameKey)) {
                    String photoUrl = mBundle.getString(AttendancePlugin.photoUrlKey, "");
                    String photoName = mBundle.getString(AttendancePlugin.photoNameKey, "");
                    fullPath = Utils.getDownloadPathFile(this).getAbsolutePath() + "/" + photoName;
                    fromPlugin = true;
                    startService(new Intent(this, ImageDownloadService.class)
                            .putExtra(ImageDownloadService.fromPluginKey, true)
                            .putExtra(ImageDownloadService.useridKey, mTaskData.getUserId())
                            .putExtra("imageUrl", photoUrl)
                            .putExtra("FileName", photoName));
                    waitForImageDownload(mTaskData.getUsername());
                } else {
                    if (!PreferencesUtil.getPreferences(this).getBoolean(PreferencesKey.isDownloaded, false)) {
                        resetAttendanceNotificationAlarm();
                    }
                    String fullFilePath = PreferencesUtil.getPreferences(this).getString(PreferencesKey.fileFullPath, "");
                    if (fullFilePath.isEmpty()) {
                        Toast.makeText(this, "Profile photo is not set.!", Toast.LENGTH_LONG).show();
                        resetAttendanceNotificationAlarm();
                    } else {
                        startFaceRecognizerActivity(fullFilePath);
                    }
                }
            } else {
                LogUtils.writeAttendanceLogToFile("mBundle is null ", "onCreate FaceDetactionActivity");
            }
        } catch (Exception e) {
            LogUtils.writeAttendanceLogToFile("Exception : " + e.toString(), "onCreate FaceDetactionActivity");
            this.finish();
        }
    }


    private void waitForImageDownload(String Username) {
        ImageDownloadService.setDownloadComplete(new ImageDownloadService.DownloadComplete() {
            @Override
            public void onSuccessDownload(String filepath) {
                startFaceRecognizerActivity(filepath);
            }

            @Override
            public void onErrorDownload(String error) {
                LogUtils.writeAttendanceLogToFile("Image not download" + error, "waitForImageDownload FaceDetactionActivity");
                setErrorResult("Unable to download profile photo for " + Username + ", please check resumable url");
            }
        });
    }

    void setErrorResult(String errorMsg) {
        Intent errorIntent = new Intent();
        errorIntent.putExtra("isError", true);
        errorIntent.putExtra("errorMsg", errorMsg);
        setResult(RESULT_CANCELED, errorIntent);
        finish();
    }

    void setSuccessResult() {
        Intent successIntent = new Intent();
        successIntent.putExtra(AttendancePlugin.resultDataKey, true);
        setResult(RESULT_OK, successIntent);
        finish();
    }

    @Override
    public void onBackPressed() {
        if (fromPlugin) {
            setErrorResult("");
        } else {
            super.onBackPressed();
        }
    }

    ActivityResultLauncher<Intent> faceRecognizerActivityResult = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    String detectionFilePath = result.getData().getStringExtra("detectionFilePath");
                    String detectionFileName = result.getData().getStringExtra("detectionFileName");
//                    without task attendance tag true get image path otherwise insert into task master
                    if(WithoutTaskAttendance.equalsIgnoreCase("true"))
                    {
                        pref.putString("detectionFilePath", detectionFilePath); // Saving string
                        pref.commit();
                        setSuccessResult();
                    }
//                  when click checkin notification load add attendance html page for single user
                    else if(IsCheckInNoti.equalsIgnoreCase("true"))
                    {
                        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                        pref.putString("photo_url", detectionFilePath);
                        pref.commit();

                        Intent LoadHtmlpage = new Intent(context, CreateAttendanceDynamictask.class);
                        LoadHtmlpage.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        LoadHtmlpage.putExtra("photo_url",detectionFilePath);
                        LoadHtmlpage.putExtra("photo_name",detectionFileName);
                        LoadHtmlpage.putExtra(AttendanceNotificationShow.taskDataKey, mTaskData);
                        context.startActivity(LoadHtmlpage);
                        this.finish();

                    }
//                    insert into task master
                    else {
                        AttendanceTaskUtil.insertIntoTaskmaster(sqlitewraper.getDatabase(),
                                AttendanceTaskUtil.getTaskCheckSheetJSon(),
                                mTaskData.getUsername() + "",
                                mTaskData.getUserId() + "",
                                mTaskData.getModuleId(),
                                mTaskData.getCheckSheetId() + "",
                                mTaskData.getModuleName() + "",
                                detectionFilePath + "",
                                detectionFileName + "",
                                "false",
                                mTaskData.getCheckOutBtn(),
                                mTaskData.getPunchin_Status(),
                                mTaskData.getPunchout_Status(),
                                mTaskData.getFacedetection());
                        if (fromPlugin) {
                            setSuccessResult();
                        } else {
                            this.finish();
                        }
                    }

                } else if (!fromPlugin) {

                    if(IsCheckInNoti.equalsIgnoreCase("true"))
                    {
                        pref.putString("flow_id", "");
                        pref.putString("flow_name", "");
                        pref.putString("task_checksheet_id", "");
                        pref.commit();
                    }
                    resetAttendanceNotificationAlarm();
                } else {
                    if(IsCheckInNoti.equalsIgnoreCase("true"))
                    {
                        pref.putString("flow_id", "");
                        pref.putString("flow_name", "");
                        pref.putString("task_checksheet_id", "");
                        pref.commit();
                    }
                    LogUtils.writeAttendanceLogToFile("User CANCELED", "faceRecognizerActivityResult FaceDetactionActivity");
                    setErrorResult("");
                }
            });

    private void startFaceRecognizerActivity(String filePath) {
        Intent faceRecognizerIntent = null;
        try {
            faceRecognizerIntent = new Intent(this, Class.forName("com.nareshchocha.facerecognition.ui.activitys.FaceRecognizerActivity"));
            faceRecognizerIntent.putExtra("imageFilePathKey", filePath);
            faceRecognizerActivityResult.launch(faceRecognizerIntent);
        } catch (ClassNotFoundException e) {
            LogUtils.writeAttendanceLogToFile("ClassNotFoundException " + e.toString(), "startFaceRecognizerActivity FaceDetactionActivity");
            if (!fromPlugin) {
                resetAttendanceNotificationAlarm();
                Toast.makeText(this,"FaceRecognizer Module is Not Added",Toast.LENGTH_LONG).show();
            } else {
                setErrorResult("FaceRecognizer Module is Not Added");
            }
        }
    }

    void resetAttendanceNotificationAlarm() {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (AttendanceUtil.getAttendanceDataList() != null) {
                AttendanceUtil.setAttendanceNotificationAlarm(AttendanceUtil.getAttendanceDataList().get(0));
            }
        }, 5000);
        finish();
    }


}