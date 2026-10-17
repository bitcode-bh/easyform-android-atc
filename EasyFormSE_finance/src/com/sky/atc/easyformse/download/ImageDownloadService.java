package com.sky.atc.easyformse.download;

import android.app.IntentService;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;


import androidx.annotation.Keep;
import androidx.core.app.NotificationCompat;

import com.sky.atc.easyformse.download.utils.PreferencesKey;
import com.sky.atc.easyformse.download.utils.PreferencesUtil;
import com.sky.atc.easyformse.download.utils.Utils;
import com.sky.atc.easyformse.utils.LogUtils;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.ResponseBody;
import okhttp3.HttpUrl;
import okhttp3.Request;
import okhttp3.Response;

@Keep
public class ImageDownloadService extends IntentService {


    private static final int NOTIFYID = 48125850;
    private static final String NotificationID = "Notification Download";

    public ImageDownloadService() {
        super("ImageDownloadService");
    }

    private NotificationCompat.Builder notificationBuilder;
    private NotificationManager notificationManager;
    private static DownloadComplete downloadComplete;

    public static void setDownloadComplete(DownloadComplete downloadComplete) {
        ImageDownloadService.downloadComplete = downloadComplete;
    }

    @Override
    protected void onHandleIntent(Intent intent) {

        final String imageUrl = intent.getExtras().getString("imageUrl", "");
        final String fileName = intent.getExtras().getString("FileName", "");
        if (intent.getExtras().containsKey(fromPluginKey) && intent.getExtras().containsKey(useridKey)) {
            fromPlugin = intent.getExtras().getBoolean(fromPluginKey, false);
            File folder = new File(Utils.getDownloadPathFile(this), intent.getExtras().getString(useridKey, "user"));
            if (!folder.exists()) {
                folder.mkdir();
            }
            outputFolder = folder;
        } else {
            fromPlugin = false;
            outputFolder = Utils.getDownloadPathFile(this);
        }


        if (fromPlugin) {
            showNotification();
            initRetrofit(imageUrl, fileName);
        } else {
            File existingFile = new File(outputFolder, fileName);
            if (!existingFile.exists()) {
                showNotification();
                initRetrofit(imageUrl, fileName);
            } else {
                if (!fromPlugin) {
                    sendProgressUpdate(true, fileName);
                }
            }
        }
    }

    private void showNotification() {
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel notificationChannel = new NotificationChannel(NotificationID, "EasyForm Image Download", NotificationManager.IMPORTANCE_LOW);
            notificationChannel.setDescription("For Image Download ");
            notificationChannel.setLightColor(Color.BLUE);
            notificationManager.createNotificationChannel(notificationChannel);
        }
        notificationBuilder = new NotificationCompat.Builder(this, NotificationID)
                .setSmallIcon(android.R.drawable.stat_sys_download)
                .setContentTitle("Download")
                .setContentText("Downloading Image")
                .setDefaults(0)
                .setAutoCancel(false);
        notificationManager.notify(NOTIFYID, notificationBuilder.build());
    }

    static OkHttpClient defaultClient() {
        return new OkHttpClient().newBuilder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .writeTimeout(15, TimeUnit.SECONDS)
                .build();
    }

    private void initRetrofit(String imageUrl, String fileName) {
        if (!fromPlugin) {
            PreferencesUtil.getPreferences(this).edit().remove(PreferencesKey.isDownloaded)
                    .remove(PreferencesKey.fileFullPath).apply();
        }
        // Absolute URLs are used as they are; relative ones resolve against the old base, as before.
        HttpUrl url = HttpUrl.get("https://development.easyform.in/").resolve(imageUrl);
        try (Response response = defaultClient().newCall(new Request.Builder().url(url).get().build()).execute()) {
            ResponseBody responseBody = response.isSuccessful() ? response.body() : null;
            if (responseBody != null) {
                downloadImage(responseBody, fileName);
            } else {
                notificationManager.cancel(NOTIFYID);
                LogUtils.writeAttendanceLogToFile("Exception : responseBody is null " + "\n imageUrl :" + imageUrl + "\nfileName :" + fileName,
                        "initRetrofit ImageDownloadService");
                if (fromPlugin) {
                    if (ImageDownloadService.downloadComplete != null) {
                        ImageDownloadService.downloadComplete.onErrorDownload("Error : responseBody is null");
                    }
                }
            }
        } catch (Exception e) {
            notificationManager.cancel(NOTIFYID);
            LogUtils.writeAttendanceLogToFile("Exception :" + e + "\n imageUrl :" + imageUrl + "\nfileName :" + fileName, "initRetrofit ImageDownloadService");
            if (fromPlugin) {
                if (ImageDownloadService.downloadComplete != null) {
                    ImageDownloadService.downloadComplete.onErrorDownload("Error :" + e.toString());
                }
            }
        }
    }

    File outputFolder;


    private void downloadImage(ResponseBody body, String fileName) throws IOException {
        int count;
        byte data[] = new byte[1024 * 4];
        long fileSize = body.contentLength();
        InputStream inputStream = new BufferedInputStream(body.byteStream(), 1024 * 8);
        File outputFile = new File(outputFolder, fileName);
        OutputStream outputStream = new FileOutputStream(outputFile);
        long total = 0;
        boolean downloadComplete = false;
        // int totalFileSize = (int) (fileSize / (Math.pow(1024, 2)));
        while ((count = inputStream.read(data)) != -1) {
            total += count;
            int progress = (int) ((double) (total * 100) / (double) fileSize);
            updateNotification(progress);
            outputStream.write(data, 0, count);
            downloadComplete = true;
        }
        outputStream.flush();
        outputStream.close();
        inputStream.close();
        onDownloadComplete(downloadComplete, fileName);
    }

    private void updateNotification(int currentProgress) {
        notificationBuilder.setProgress(100, currentProgress, false);
        notificationBuilder.setContentText("Downloaded: " + currentProgress + "%");
        notificationManager.notify(NOTIFYID, notificationBuilder.build());
    }

    private void sendProgressUpdate(boolean downloadComplete, String fileName) {
        if (downloadComplete) {
            File existingFile = new File(outputFolder, fileName);
            if (existingFile.exists()) {
                PreferencesUtil.getPreferences(this).edit().putBoolean(PreferencesKey.isDownloaded, true)
                        .putString(PreferencesKey.fileFullPath, existingFile.getAbsolutePath()).apply();
            } else {
                PreferencesUtil.getPreferences(this).edit().remove(PreferencesKey.isDownloaded)
                        .remove(PreferencesKey.fileFullPath).apply();
            }
        }
    }

    public static final String fromPluginKey = "fromPluginKey";
    public static final String useridKey = "useridKey";
    private boolean fromPlugin = false;


    private void onDownloadComplete(boolean downloadComplete, String fileName) {
        notificationManager.cancel(NOTIFYID);
        if (!fromPlugin) {
            sendProgressUpdate(downloadComplete, fileName);
        }
        if (downloadComplete && fromPlugin) {
            if (ImageDownloadService.downloadComplete != null) {
                ImageDownloadService.downloadComplete.onSuccessDownload(outputFolder.getAbsolutePath() + "/" + fileName);
            }
        } else if (fromPlugin) {
            if (ImageDownloadService.downloadComplete != null) {
                ImageDownloadService.downloadComplete.onErrorDownload("Error on download");
            }
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        if (notificationManager != null)
            notificationManager.cancel(NOTIFYID);
    }

    public interface DownloadComplete {
        void onSuccessDownload(String filepath);

        void onErrorDownload(String error);
    }


}