package com.sky.atc.easyformse;


import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.StrictMode;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.sky.atc.easyformse.attendance.newattendanceutils.broadcasts.AttendanceNotificationShow;
import com.sky.atc.easyformse.attendance.newattendanceutils.models.TaskData;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.download.ImageDownloadService;
import com.sky.atc.easyformse.plugins.AttendancePlugin;
import com.sky.atc.easyformse.plugins.GroupAttendancePlugin;
import com.sky.atc.easyformse.utils.LogUtils;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;


public class GroupFaceDetactionActivity extends AppCompatActivity {

    TaskData mTaskData;
    String fullPath;
    boolean fromPlugin = false;
    String WithoutTaskAttendance;
    MySharedPreferences pref;
    String IsCheckInNoti;
    List<String> downloadedPaths = new ArrayList<>();
    String url;
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

                        String photoUrlJson = mBundle.getString(AttendancePlugin.photoUrlKey, "");
                        String photoName = mBundle.getString(AttendancePlugin.photoNameKey, "");

                        try {
                            JSONArray photoArray = new JSONArray(photoUrlJson);
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
                            startMultipleFaceRecognizerActivity(downloadedPaths);
                        }
                        catch (Exception e)
                        {
                            e.printStackTrace();
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


    void setErrorResult(String errorMsg) {
        Intent errorIntent = new Intent();
        errorIntent.putExtra("isError", true);
        errorIntent.putExtra("errorMsg", errorMsg);
        setResult(RESULT_CANCELED, errorIntent);
        finish();
    }

    void setSuccessResult() {
        Intent successIntent = new Intent();
        successIntent.putExtra(GroupAttendancePlugin.resultDataKey, true);
        setResult(RESULT_OK, successIntent);
        finish();
    }

    @Override
    public void onBackPressed() {
        if (fromPlugin) {
            setErrorResult("");
        } else {
            super.onBackPressed();
            finish();
        }
    }

    ActivityResultLauncher<Intent> faceRecognizerActivityResult = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    String detectionFilePath = result.getData().getStringExtra("detectionFilePath");
                    String detectionFileName = result.getData().getStringExtra("detectionFileName");
                    pref.putString("detectionFilePath", detectionFilePath); // Saving string
                    pref.commit();
                    setSuccessResult();
//                    without task attendance tag true get image path otherwise insert into task master
//                    if(WithoutTaskAttendance.equalsIgnoreCase("true"))
//                    {
//                        pref.putString("detectionFilePath", detectionFilePath); // Saving string
//                        pref.commit();
//                        setSuccessResult();
//                    }
////                  when click checkin notification load add attendance html page for single user
//                    else if(IsCheckInNoti.equalsIgnoreCase("true"))
//                    {
//                        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
//                        pref.putString("photo_url", detectionFilePath);
//                        pref.commit();
//
//                        Intent LoadHtmlpage = new Intent(context, CreateAttendanceDynamictask.class);
//                        LoadHtmlpage.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//                        LoadHtmlpage.putExtra("photo_url",detectionFilePath);
//                        LoadHtmlpage.putExtra("photo_name",detectionFileName);
//                        LoadHtmlpage.putExtra(AttendanceNotificationShow.taskDataKey, mTaskData);
//                        context.startActivity(LoadHtmlpage);
//                        this.finish();
//
//                    }
////                    insert into task master
//                    else {
//                        AttendanceTaskUtil.insertIntoTaskmaster(sqlitewraper.getDatabase(),
//                                AttendanceTaskUtil.getTaskCheckSheetJSon(),
//                                mTaskData.getUsername() + "",
//                                mTaskData.getUserId() + "",
//                                mTaskData.getModuleId(),
//                                mTaskData.getCheckSheetId() + "",
//                                mTaskData.getModuleName() + "",
//                                detectionFilePath + "",
//                                detectionFileName + "",
//                                "false",
//                                mTaskData.getCheckOutBtn(),
//                                mTaskData.getPunchin_Status(),
//                                mTaskData.getPunchout_Status());
//                        if (fromPlugin) {
//                            setSuccessResult();
//                        } else {
//                            this.finish();
//                        }
//                    }

                }
            });





//    multiple image url download
    private void waitForAllImageDownloads(JSONArray photoArray, String username) {
        int totalImages = photoArray.length();
        List<String> downloadedPaths = new ArrayList<>();
        AtomicInteger completedCount = new AtomicInteger(0);

        ImageDownloadService.setDownloadComplete(new ImageDownloadService.DownloadComplete() {
            @Override
            public void onSuccessDownload(String filepath) {
                downloadedPaths.add(filepath);

                // Check if all downloads are done
                if (completedCount.incrementAndGet() == totalImages) {
                    if (!downloadedPaths.isEmpty()) {
                        // All done, some success — send to recognizer
                        startMultipleFaceRecognizerActivity(downloadedPaths);
                    } else {
                        // All failed
                        setErrorResult("Unable to download any profile photo for " + username);
                    }
                }
            }

            @Override
            public void onErrorDownload(String error) {
                if (completedCount.incrementAndGet() == totalImages) {
                    if (!downloadedPaths.isEmpty()) {
                        // At least some succeeded
                        startMultipleFaceRecognizerActivity(downloadedPaths);
                    } else {
                        setErrorResult("Unable to download any profile photo for " + username);
                    }
                }
            }
        });
    }


//    muliple image face activity open
    private void startMultipleFaceRecognizerActivity(List<String> filePaths) {
        Intent intent = null;
        try {
            intent = new Intent(this, Class.forName("com.nareshchocha.facerecognition.ui.activitys.GroupFaceRecognizerActivity"));
            intent.putStringArrayListExtra("imageFilePathList", new ArrayList<>(filePaths));
            faceRecognizerActivityResult.launch(intent);

        } catch (ClassNotFoundException e) {
            LogUtils.writeAttendanceLogToFile("ClassNotFoundException " + e.toString(), "startFaceRecognizerActivity");
            if (!fromPlugin) {
                Toast.makeText(this, "FaceRecognizer Module is Not Added", Toast.LENGTH_LONG).show();
            } else {
                setErrorResult("FaceRecognizer Module is Not Added");
            }
        }
    }



}