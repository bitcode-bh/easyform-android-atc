package com.sky.atc.easyformse.plugins;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;
import android.widget.Toast;

import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.File;

public class VideoDownloadPlugin extends CordovaPlugin {

    public static final String TYPE_NONE = "NONE";
    public CallbackContext callbackContext;
    String video_url;
    SQLiteDatabase database;
    String filename;
    private Context context;
    private boolean isDownloading = false;

    @Override
    protected void pluginInitialize() {
        context = cordova.getActivity().getApplicationContext();
        database = sqlitewraper.getDatabase();
        registerDownloadReceiver();
    }


    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {
        try {
            database = sqlitewraper.getDatabase();
            this.callbackContext = callbackContext;
            video_url = args.getJSONObject(0).getString("video_url");

//            Intent i = new Intent(sqlitewraper.context, VideoURLDownloadActivity.class);
//            i.putExtra("video_url", video_url);
//
//            this.cordova.startActivityForResult(this, i, 101);
            if (video_url == null || video_url.isEmpty()) {
                Toast.makeText(this.cordova.getActivity(), "Url not found", Toast.LENGTH_LONG).show();
                callbackContext.error("URL not found");
                return true;
            }

            String existingPath = getDownloadPathFromDB(video_url);
            if (existingPath != null && !existingPath.isEmpty()) {
                File file = new File(existingPath);
                    if (!file.exists()) {
                        // File doesn't exist, clear path in DB to allow re-download
                        updateDownloadPathByUrl(video_url, "");
                        existingPath = null;
                        String filename = video_url.substring(video_url.lastIndexOf("/") + 1);
                        long downloadId = startDownload(video_url, filename);

                        SharedPreferences prefs = context.getSharedPreferences("VideoDownloadPrefs", Context.MODE_PRIVATE);
                        prefs.edit()
                                .putLong("downloadId", downloadId)
                                .putString("videoUrl", video_url)
                                .apply();
                    }

                return true;
            } else {
                // Insert url if not exists, start download
                handleDownload(video_url);
            }




//            Insert_video_url(video_url);
//            filename = video_url.substring(video_url.lastIndexOf("/") + 1);
//
//            long downloadId = startDownload(video_url, filename);

            return true;
        }
        catch ( Exception e)
        {
            this.callbackContext.success("Error");
            return false;
        }
    }

    private void handleDownload(String videoUrl) {

        if (isDownloading) {
            // Already downloading, notify JS or ignore
            if (callbackContext != null) {
                PluginResult result = new PluginResult(PluginResult.Status.ERROR, "Another download is already in progress");
                result.setKeepCallback(false);
                callbackContext.sendPluginResult(result);
            }
            return; // Don't start new download
        }
        isDownloading = true;
        // Insert video URL in table
         Insert_video_url(videoUrl);

        String filename = videoUrl.substring(videoUrl.lastIndexOf("/") + 1);

        // Start Download and store downloadId with rowId mapping
        long downloadId = startDownload(videoUrl, filename);

        SharedPreferences prefs = context.getSharedPreferences("VideoDownloadPrefs", Context.MODE_PRIVATE);
        prefs.edit()
                .putLong("downloadId", downloadId)
                .putString("videoUrl", videoUrl)
                .apply();

        callbackContext.success("Download started");
    }

    private long startDownload(String url, String filename) {
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle(filename);
        request.setMimeType("video/mp4");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
        request.allowScanningByMediaScanner();

        DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        return dm.enqueue(request);
    }

    private BroadcastReceiver downloadReceiver;

    private void registerDownloadReceiver() {
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;

                long downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (downloadId == -1) return;

                SharedPreferences prefs = context.getSharedPreferences("VideoDownloadPrefs", Context.MODE_PRIVATE);
                long savedDownloadId = prefs.getLong("downloadId", -1);
                long rowId = prefs.getLong("dbRowId", -1);

                if (downloadId != savedDownloadId) return; // Not our download

                DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                DownloadManager.Query query = new DownloadManager.Query();
                query.setFilterById(downloadId);

                Cursor cursor = dm.query(query);
                if (cursor != null && cursor.moveToFirst()) {
                    @SuppressLint("Range") int status = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS));
                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        @SuppressLint("Range") String localUri = cursor.getString(cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI));
                        if (localUri != null) {
                            Uri fileUri = Uri.parse(localUri);
                            String filePath = fileUri.getPath();

                            // Update DB with local path
                            updateDownloadPathByUrl(video_url, filePath);

                            // Notify JS success with file path
//                            if (callbackContext != null) {
//                                PluginResult result = new PluginResult(PluginResult.Status.OK, filePath);
//                                result.setKeepCallback(false);
//                                callbackContext.sendPluginResult(result);
//                            }
                        }
                    } else {
                        // Download failed, notify JS error
                        if (callbackContext != null) {
                            PluginResult result = new PluginResult(PluginResult.Status.ERROR, "Download failed");
                            result.setKeepCallback(false);
                            callbackContext.sendPluginResult(result);
                        }
                    }
                    cursor.close();
                }
                isDownloading = false;
                prefs.edit().remove("downloadId").remove("videoUrl").apply();

            }
        };

        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        context.registerReceiver(downloadReceiver, filter);
    }

    @Override
    public void onDestroy() {
        if (downloadReceiver != null) {
            context.unregisterReceiver(downloadReceiver);
            downloadReceiver = null;
        }
        super.onDestroy();
    }


    public void Insert_video_url(String video_url)
    {
        ContentValues args = new ContentValues();
        args.put("live_url", video_url);

        long temp = database.insert("download_live_url", null, args);

    }

    public void updateDownloadPathByUrl(String url, String path) {

        Log.d("path",path);
        ContentValues values = new ContentValues();
        values.put("download_url_path", path);
        database.update("download_live_url", values, "live_url = ?", new String[]{url});
    }


    @SuppressLint("Range")
    private String getDownloadPathFromDB(String videoUrl) {
        String path = null;
        Cursor cursor = database.rawQuery("SELECT download_url_path FROM download_live_url WHERE live_url = ?", new String[]{videoUrl});
        if (cursor != null && cursor.moveToFirst()) {
            path = cursor.getString(cursor.getColumnIndex("download_url_path"));
            cursor.close();
        }


        return path;
    }




    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);

        if (requestCode == requestCode && resultCode == Activity.RESULT_OK) {
            if (intent.getExtras() != null) {
                String status = null;
                try {
                    String success = intent.getExtras().getString("success");
                    //Log.d("Videoplugin",success);
                    this.callbackContext.success(success);
                } catch (Exception e) {
                    LogUtils.writeAttendanceLogToFile("Exception :" + e.toString(), "onActivityResult GroupAttendancePlugin");
                    this.callbackContext.error("error:  " + e.toString());
                }
            }
        }
    }
}
