package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Environment;
import android.os.StrictMode;
import android.preference.PreferenceManager;
import android.provider.Settings;
import android.util.Log;
import android.view.View;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.bumptech.glide.Glide;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;

public class VideoURLDownloadActivity extends AppCompatActivity {


    ProgressDialog progressBar;
    String url_new;
    TextView Tryagain;
    File file;
    String type = "NA";
    TextView t;


    boolean check;
    int dl_progress;
    boolean downloading = true;
    int count = 0;
    String filename;
    int bytes_total;
    int bytes_downloaded;
    public static final String MyPREFERENCES = "MyPrefs";
    SharedPreferences sharedpreferences;
    DownloadManager manager;
    MySharedPreferences pref;
    ProgressBar mProgressBar;
    TextView percentageTextView;
    ImageView mImageView_downloading;
    String Colorcode;
    private static final int PERMISSION_REQUEST_CODE = 201;
    String video_url;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
                .permitAll().build();
        StrictMode.setThreadPolicy(policy);
        Log.d("##DOWNLOADID1", "demo ");
        try {
            setContentView(R.layout.new_main_acti);
            if (checkPermission()) {
                DownloadUrl();
            } else {
                requestPermission();
            }

        } catch (Exception e) {
            Log.e("Error:", e.toString());
        }

    }

    public void DownloadUrl() {
        try {

            t = (TextView) findViewById(R.id.textView_downloading);
            Bundle b = getIntent().getExtras();
            video_url = b.getString("video_url");

            t.setText("Don't close this window, Video is being downloading...");
            //  Colorcode = b.getString("Colorcode");
            this.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            Tryagain = (TextView) findViewById(R.id.TryAgain);
            pref = sqlitewraper.getSecureShared("MyPref");
            Colorcode = pref.getString("themecolor", "");
            if (Colorcode.equalsIgnoreCase("")) {
                Tryagain.setBackgroundColor(Color.parseColor("#e60000"));
            } else {
                Tryagain.setBackgroundColor(Color.parseColor(Colorcode));
            }


            mProgressBar = findViewById(R.id.progressBar);
            percentageTextView = findViewById(R.id.percentageTextView);

            mImageView_downloading = findViewById(R.id.imageview_downloading);
            Glide.with(this)
                    .load(R.drawable.download) // Replace with your GIF image resource
                    .into(mImageView_downloading);

            sharedpreferences = getSharedPreferences(MyPREFERENCES, Context.MODE_PRIVATE);
            manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);


            if (video_url.equalsIgnoreCase("")) {
                isGoBack = true;
                Toast.makeText(this, "Url not found", Toast.LENGTH_LONG).show();
                finish();
            }

            url_new = video_url;
            filename = url_new.substring(url_new.lastIndexOf("/") + 1);

            // ✅ Cancel previous download if any and delete partial files
            resetOldDownload();

            // ✅ If file already exists, return it instead of downloading
            if (checkIfFileExistsAndReturn()) {
                return;
            }

            new DownloadFileFromURL().execute("kl");
            pref = sqlitewraper.getSecureShared("UPDATEPREF");
            pref.putString("UPDATEMILLI", String.valueOf(System.currentTimeMillis())); // Saving string
            pref.commit();
            Log.d("##newmainActivity", "");

            sharedpreferences = PreferenceManager.getDefaultSharedPreferences(this);
            Long downloadId = sharedpreferences.getLong("downloadId", 0l);
            Log.d("##DOWNLOADID1", downloadId.toString());

            Cursor cursor = manager.query(new DownloadManager.Query().setFilterById(downloadId));

            if (cursor != null && cursor.moveToNext()) {
                @SuppressLint("Range") int status1 = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS));
                Log.d("##DOWNLOADID2", String.valueOf(status1));

                if (status1 == DownloadManager.STATUS_RUNNING) {
                    Log.d("##DOWNLOADSTATUS", "PENDING_RUNNING");
                    new DownloadFileFromURL1().execute(downloadId);
                } else if (status1 == DownloadManager.STATUS_PAUSED) {
                    Log.d("##DOWNLOADSTATUS", "PENDING_PAUSED");
                    new DownloadFileFromURL1().execute(downloadId);
                } else if (status1 == DownloadManager.STATUS_PENDING) {
                    Log.d("##DOWNLOADSTATUS", "PENDING_PENDING");
                    new DownloadFileFromURL1().execute(downloadId);
                } else if (status1 == DownloadManager.STATUS_FAILED) {
                    Log.d("##DOWNLOADSTATUS", "PENDING_FAILED");
                    data d = new data();
                    if (d.getDownloadid().equals(downloadId)) {
                        manager.remove(downloadId);
                        data d_new = new data();
                        d_new.setDownloadid("NA");
                    }
                    check = false;
                    runOnUiThread(() -> Tryagain.setVisibility(View.VISIBLE));
                } else {

                    File sdcard = com.sky.atc.easyformse.utils.AppStorage.downloads();

                    file = new File(sdcard, filename);

                    if (file.exists()) {
                        //file.delete();
                    } else {
                        new DownloadFileFromURL().execute("kl");
                        pref = sqlitewraper.getSecureShared("UPDATEPREF");
                        pref.putString("UPDATEMILLI", String.valueOf(System.currentTimeMillis())); // Saving string
                        pref.commit();
                        Log.d("##newmainActivity", "");
                    }
                }
            } else {

                new DownloadFileFromURL().execute("kl");

                pref = sqlitewraper.getSecureShared("UPDATEPREF");
                pref.putString("UPDATEMILLI", String.valueOf(System.currentTimeMillis())); // Saving string
                pref.commit();
                Log.d("##newmainActivity", "");

            }

        } catch (Exception e) {
            Log.e("Error:", e.toString());
        }

    }


    class DownloadFileFromURL extends AsyncTask<String, Integer, String> {

        /**
         * Before starting background thread Show Progress Bar Dialog
         */
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            mProgressBar.setVisibility(View.VISIBLE);
            percentageTextView.setVisibility(View.VISIBLE);
            if (Colorcode.equalsIgnoreCase("")) {
                mProgressBar.setProgressTintList(ColorStateList.valueOf(Color.parseColor("#e60000")));
            } else {
                mProgressBar.setProgressTintList(ColorStateList.valueOf(Color.parseColor(Colorcode)));
            }
        }


        /**
         * Downloading file in background thread
         */
        @Override
        protected String doInBackground(String... f_url) {
            int count = 0;
            try {

                DownloadManager.Request request = new DownloadManager.Request(
                        Uri.parse(url_new));
                request.setTitle(filename);
                request.allowScanningByMediaScanner();
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setMimeType("video/mp4");
                request.setVisibleInDownloadsUi(false);


                File sdcard = com.sky.atc.easyformse.utils.AppStorage.downloads();

                file = new File(sdcard, filename);
                if (file.exists()) {
                    com.sky.atc.easyformse.utils.AppStorage.downloadTo(request, filename);
                }

                if (!file.exists()) {
                    com.sky.atc.easyformse.utils.AppStorage.downloadTo(request, filename);
                }

                final long downloadId = manager.enqueue(request);
                Log.d("##DOWNLOADID3", String.valueOf(downloadId));
                SharedPreferences.Editor editor = sharedpreferences.edit();
                editor.putLong("downloadId", downloadId);
                editor.apply();
                check = true;
                while (downloading && check) {

                    down(url_new, downloadId, manager);
                    Thread.sleep(500);

                }

            } catch (Exception e) {
                Log.e("Error: ", e.toString());
            }

            return null;
        }

        @Override
        protected void onPostExecute(String file_url) {
            mProgressBar.setVisibility(View.GONE);
        }

    }

    class DownloadFileFromURL1 extends AsyncTask<Long, Integer, Long> {

        /**
         * Before starting background thread Show Progress Bar Dialog
         */
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            mProgressBar.setVisibility(View.VISIBLE);
            percentageTextView.setVisibility(View.VISIBLE);
            mProgressBar.setProgressTintList(ColorStateList.valueOf(Color.parseColor(Colorcode)));

        }


        /**
         * Downloading file in background thread
         */
        @Override
        protected Long doInBackground(Long... f_url) {
            int count = 0;
            try {
                Long downloadId = f_url[0];

                check = true;
                while (downloading && check) {

                    down1(url_new, downloadId, manager);

                }

            } catch (Exception e) {
                Log.e("Error: ", e.getMessage());
            }

            return null;
        }

        @Override
        protected void onPostExecute(Long file_url) {
            // dismiss the dialog after the file was downloaded

            // Displaying downloaded image into image view
            // Reading image path from sdcard

//            progressBar.hide();
            mProgressBar.setVisibility(View.GONE);

        }

    }

    boolean isGoBack = false;

    @Override
    public void onBackPressed() {

        if (isGoBack) {
            Bundle b = new Bundle();
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);
            this.finish();
        } else {

        }

    }

    private void setResultSucceededData(File Downloadpath) {
        try {
            System.out.println("called: " + Downloadpath.getAbsolutePath());
            Intent resultIntent = new Intent();
            JSONObject mJsonObject = new JSONObject();
            JSONArray mJsonArray = new JSONArray();
            mJsonObject.put("video_path", Downloadpath.getAbsolutePath());
            mJsonArray.put(mJsonObject);
            resultIntent.putExtra("success", mJsonArray.toString());
            setResult(RESULT_OK, resultIntent);
            finish();
        } catch (Exception e) {

        }
    }


    @SuppressLint("Range")
    void down(String download_url, long downloadId,
              DownloadManager manager) {

        DownloadManager.Query q = new DownloadManager.Query();
        q.setFilterById(downloadId);

        Cursor cursor = manager.query(q);
        cursor.moveToFirst();
        bytes_downloaded = cursor
                .getInt(cursor
                        .getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
        bytes_total = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
        dl_progress = (int) ((bytes_downloaded * 100l) / bytes_total);
        mProgressBar.setProgress((int) ((bytes_downloaded * 100l) / bytes_total));

        runOnUiThread(new Runnable() {
            public void run() {
                mProgressBar.setProgress(dl_progress);
                percentageTextView.setText(String.valueOf(dl_progress) + "%");
            }
        });
        if (cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_SUCCESSFUL) {

            downloading = false;
            setResultSucceededData(file);

        } else if (cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_FAILED) {
            getreason(cursor);
            data d = new data();
            if (d.getDownloadid().equals(downloadId)) {
                manager.remove(downloadId);
                data d_new = new data();
                d_new.setDownloadid("NA");

            }
            check = false;

            runOnUiThread(new Runnable() {
                public void run() {
                    Tryagain.setVisibility(View.VISIBLE);
                }
            });

        } else {

            data d = new data();
            if (d.getDownloadid().equals(downloadId)) {
                manager.remove(downloadId);
                data d_new = new data();
                d_new.setDownloadid("NA");

            }

        }
        count++;

        cursor.close();
    }

    void getreason(Cursor cursor) {
        String failedReason = "";
        int columnReason = cursor.getColumnIndex(DownloadManager.COLUMN_REASON);
        int reason = cursor.getInt(columnReason);
        switch (reason) {
            case DownloadManager.ERROR_CANNOT_RESUME:
                failedReason = "ERROR_CANNOT_RESUME";
                break;
            case DownloadManager.ERROR_DEVICE_NOT_FOUND:
                failedReason = "ERROR_DEVICE_NOT_FOUND";
                break;
            case DownloadManager.ERROR_FILE_ALREADY_EXISTS:
                failedReason = "ERROR_FILE_ALREADY_EXISTS";
                break;
            case DownloadManager.ERROR_FILE_ERROR:
                failedReason = "ERROR_FILE_ERROR";
                break;
            case DownloadManager.ERROR_HTTP_DATA_ERROR:
                failedReason = "ERROR_HTTP_DATA_ERROR";
                break;
            case DownloadManager.ERROR_INSUFFICIENT_SPACE:
                failedReason = "ERROR_INSUFFICIENT_SPACE";
                break;
            case DownloadManager.ERROR_TOO_MANY_REDIRECTS:
                failedReason = "ERROR_TOO_MANY_REDIRECTS";
                break;
            case DownloadManager.ERROR_UNHANDLED_HTTP_CODE:
                failedReason = "ERROR_UNHANDLED_HTTP_CODE";
                break;
            case DownloadManager.ERROR_UNKNOWN:
                failedReason = "ERROR_UNKNOWN";
                break;
        }
        Toast.makeText(this, "Download failed because " + failedReason, Toast.LENGTH_SHORT).show();

    }

    @SuppressLint("Range")
    void down1(String download_url, final long downloadId,
               final DownloadManager manager) {

        DownloadManager.Query q = new DownloadManager.Query();
        q.setFilterById(downloadId);

        Cursor cursor = manager.query(q);
        cursor.moveToFirst();
        bytes_downloaded = cursor
                .getInt(cursor
                        .getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
        bytes_total = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
        dl_progress = (int) ((bytes_downloaded * 100l) / bytes_total);
        mProgressBar.setProgress((int) ((bytes_downloaded * 100l) / bytes_total));
        runOnUiThread(new Runnable() {
            public void run() {
                percentageTextView.setText(String.valueOf(dl_progress) + "%");
            }
        });

        if (cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_SUCCESSFUL) {

            downloading = false;

        } else if (cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_FAILED) {
            data d = new data();
            if (d.getDownloadid().equals(downloadId)) {
                manager.remove(downloadId);
                data d_new = new data();
                d_new.setDownloadid("NA");

            }
            check = false;

            runOnUiThread(new Runnable() {
                public void run() {
                    Tryagain.setVisibility(View.VISIBLE);
                }
            });

        } else {

            data d = new data();
            if (d.getDownloadid().equals(downloadId)) {
                manager.remove(downloadId);
                data d_new = new data();
                d_new.setDownloadid("NA");

            }

        }
        count++;
        cursor.close();
    }

    private boolean checkPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            // Permission is not granted
            return false;
        }
        return true;
    }

    private void requestPermission() {

        ActivityCompat.requestPermissions(VideoURLDownloadActivity.this,
                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE},
                PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case PERMISSION_REQUEST_CODE:
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                        && grantResults[1] == PackageManager.PERMISSION_GRANTED) {
                    // Toast.makeText(getApplicationContext(), "Permission Granted", Toast.LENGTH_SHORT).show();
                    DownloadUrl();
                    // main logic
                } else {
                    // Toast.makeText(getApplicationContext(), "Permission Denied", Toast.LENGTH_SHORT).show();
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {

                        showMessageOKCancel("You need to allow access file and media permissions",
                                new DialogInterface.OnClickListener() {
                                    @Override
                                    public void onClick(DialogInterface dialog, int which) {
                                        Intent intent = new Intent();
                                        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                                        intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                                        mainactivity.startActivity(intent);
                                        finish();
                                    }
                                });

                    }
                }
                break;
        }
    }

    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(VideoURLDownloadActivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }

    private boolean checkIfFileExistsAndReturn() {
        File sdcard = com.sky.atc.easyformse.utils.AppStorage.downloads();
        file = new File(sdcard, filename);

        if (file.exists()) {
            Log.d("##FILE", "File already exists, returning path.");
            setResultSucceededData(file);
            return true;
        }
        return false;
    }

    private void resetOldDownload() {
        long downloadId = sharedpreferences.getLong("downloadId", -1);
        if (downloadId != -1) {
            try {
                manager.remove(downloadId);
            } catch (Exception e) {
                Log.e("##DownloadReset", "Error removing old download: " + e.getMessage());
            }

            // Delete partial file (if it exists)
            File sdcard = com.sky.atc.easyformse.utils.AppStorage.downloads();
            File partialFile = new File(sdcard, filename);
            if (partialFile.exists()) {
                partialFile.delete();
            }

            SharedPreferences.Editor editor = sharedpreferences.edit();
            editor.remove("downloadId");
            editor.apply();
        }
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();

        // Clean up download info when activity is destroyed
        if (sharedpreferences != null && sharedpreferences.contains("downloadId")) {
            long downloadId = sharedpreferences.getLong("downloadId", -1);
            if (downloadId != -1) {
                try {
                    manager.remove(downloadId);
                } catch (Exception e) {
                    Log.e("##Destroy", "Failed to remove download: " + e.getMessage());
                }
            }

            SharedPreferences.Editor editor = sharedpreferences.edit();
            editor.remove("downloadId");
            editor.apply();
        }
    }


}

// --------------------------------------------------------------------------------------

