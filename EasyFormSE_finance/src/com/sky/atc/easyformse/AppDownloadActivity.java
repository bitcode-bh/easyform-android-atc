package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
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
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.StrictMode;
import android.preference.PreferenceManager;
import android.provider.Settings;
import android.text.Html;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.bumptech.glide.Glide;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.squareup.picasso.Picasso;

import org.json.JSONArray;
import org.json.JSONObject;
import org.ksoap2.SoapEnvelope;
import org.ksoap2.serialization.PropertyInfo;
import org.ksoap2.serialization.SoapObject;
import org.ksoap2.serialization.SoapPrimitive;
import org.ksoap2.serialization.SoapSerializationEnvelope;
import org.ksoap2.transport.HttpTransportSE;

import java.io.File;

public class AppDownloadActivity extends AppCompatActivity {

    private static String METHOD_NAME_corner = "Wcf_GetApplicationURL_New";
    private static final int TIMEOUT = 520000;
    ProgressDialog progressBar;
    String url_new;
    TextView Tryagain;
    File file;
    String type = "NA";
    TextView t;
    NewWebservicesCallEasyform NewWebservicesCallEasyform;
    private static final String WCFURL = sqlitewraper.context.getResources().getString(R.string.WCFURL);

    boolean check;
    int dl_progress;
    boolean downloading = true;
    int count = 0;
    String apkname;
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
    String username;
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

    public void DownloadUrl()
    {
        try{
            NewWebservicesCallEasyform = new NewWebservicesCallEasyform();
            t = (TextView) findViewById(R.id.textView_downloading);
            Bundle b = getIntent().getExtras();
            username = b.getString("username");
            type = b.getString("type");
            //  Colorcode = b.getString("Colorcode");
            this.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            Tryagain = (TextView) findViewById(R.id.TryAgain);
            pref = sqlitewraper.getSecureShared("MyPref");
            Colorcode = pref.getString("themecolor","");
            if(Colorcode.equalsIgnoreCase(""))
            {
                Tryagain.setBackgroundColor(Color.parseColor("#e60000"));
            }
            else {
                Tryagain.setBackgroundColor(Color.parseColor(Colorcode));
            }


            mProgressBar  = findViewById(R.id.progressBar);
            percentageTextView = findViewById(R.id.percentageTextView);

            mImageView_downloading = findViewById(R.id.imageview_downloading);
            Glide.with(this)
                    .load(R.drawable.download) // Replace with your GIF image resource
                    .into(mImageView_downloading);

            sharedpreferences = getSharedPreferences(MyPREFERENCES, Context.MODE_PRIVATE);
            manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);

            if (type.equalsIgnoreCase("barcode") || type.equalsIgnoreCase("video") || type.equalsIgnoreCase("meter_reading") || type.equalsIgnoreCase("rftracking")) {
                METHOD_NAME_corner = "Wcf_GetFeatureApplicationURL";
                t.setText("Don't close this window," +
                        " another required application is downloading...");
            }
            else {
                t.setText("Don't close this window, new application is being downloading...");
            }


            pref.putString("username",username);
            pref.commit();

            JSONObject data1 = new JSONObject();
            data1.put("version", BuildConfig.VERSION_NAME);
            data1.put("username", username);
            data1.put("Feature", type);

            String restext = NewWebservicesCallEasyform.ExecuteNetworkHTTPPostRequest(data1, WCFURL, METHOD_NAME_corner);


            //New Webservices Call
            String url_get = null;
            String status = null;
            String message = null;
            Log.d("##DOWNLOADID1", restext.toString());
            JSONArray jsonArray1 = new JSONArray(restext);
            for (int k = 0; k < jsonArray1.length(); k++) {
                JSONObject jsonObject = jsonArray1.getJSONObject(0);
                status = jsonObject.getString("status");
                url_get = jsonObject.getString("url");
                message = jsonObject.getString("message");
            }

            if (status.equalsIgnoreCase("1")) {

                url_new = url_get;

                if(url_get.equalsIgnoreCase(""))
                {
                    isGoBack = true;
                    Toast.makeText(this, "Url not found", Toast.LENGTH_LONG).show();
                    finish();
                }

                apkname = url_new.substring(url_new.lastIndexOf("/") + 1);

                sharedpreferences = PreferenceManager.getDefaultSharedPreferences(this);
                Long downloadId = sharedpreferences.getLong("downloadId", 0l);
                Log.d("##DOWNLOADID1", downloadId.toString());

                Cursor cursor = manager.query(new DownloadManager.Query().setFilterById(downloadId));

                if (cursor != null && cursor.moveToNext()) {
                    int status1 = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS));
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

                        File sdcard = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);

                        file = new File(sdcard, apkname);

                        if (file.exists()) {
                            installApk();
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

            } else {
                isGoBack = true;
                Toast.makeText(getApplicationContext(), message, Toast.LENGTH_SHORT).show();
                finish();
            }

            Tryagain.setOnClickListener(new View.OnClickListener() {

                @Override
                public void onClick(View v) {
                    if (sqlitewraper.internetflag == 1) {

                        new DownloadFileFromURL().execute("kl");
                    } else {

                        AlertDialog.Builder builder1 = new AlertDialog.Builder(
                                AppDownloadActivity.this);
                        builder1.setMessage("Please start Your Internet After that try agian...");
                        builder1.setCancelable(true);
                        builder1.setPositiveButton("Ok",
                                new DialogInterface.OnClickListener() {
                                    public void onClick(DialogInterface dialog,
                                                        int id) {
                                        dialog.cancel();
                                    }
                                });

                        AlertDialog alert11 = builder1.create();
                        alert11.show();

                    }

                }
            });
        }
        catch (Exception e)
        {
            Log.e("Error:", e.toString());
        }

    }

    public void webservice(JSONObject data1, SoapObject data, String URL1,
                           String Soap_action) {
        String resTxt = null;
        try {

            JSONArray jsonArray = new JSONArray();
            PropertyInfo pi = new PropertyInfo();
            pi.setName("data");
            pi.setValue(jsonArray.put(data1).toString());
            data.addProperty(pi);

            SoapSerializationEnvelope envelope = new SoapSerializationEnvelope(
                    SoapEnvelope.VER11);
            envelope.dotNet = true;
            envelope.setOutputSoapObject(data);
            envelope.bodyOut = data;
            Log.d("ENVELOPE", "" + "Coming3");
            //TrustManagerManipulator.allowAllSSL();

            HttpTransportSE androidHttpTransport = new HttpTransportSE(URL1,
                    TIMEOUT);
            androidHttpTransport.debug = true;
            String t = androidHttpTransport.requestDump;
            androidHttpTransport.call(Soap_action, envelope);
            Object result = envelope.getResponse();

            SoapObject response1 = (SoapObject) envelope.bodyIn;
            SoapPrimitive response = (SoapPrimitive) envelope.getResponse();
            // Assign it to resTxt variable static variable
            resTxt = response.toString();
            String url_get = null;

            JSONArray jsonArray1 = new JSONArray(resTxt);
            for (int k = 0; k < jsonArray1.length(); k++) {
                JSONObject jsonObject = jsonArray1.getJSONObject(0);
                String status = jsonObject.getString("status");
                url_get = jsonObject.getString("url");
            }

            url_new = url_get;

            new DownloadFileFromURL().execute("kl");
//			 resume_download();
            // downloadapk(url);

            // return resTxt;
        } catch (Exception e) {

            //e.printStackTrace();
        }

        // return resTxt;
    }

    private void installApk() {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        File appFile = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), apkname);
        if (!appFile.exists() || !appFile.isFile()) {
            Toast.makeText(this, "appFile file has problem!", Toast.LENGTH_SHORT).show();
            runOnUiThread(() -> Tryagain.setVisibility(View.VISIBLE));
        }
        Uri uri;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                uri = FileProvider.getUriForFile(sqlitewraper.context,
                        BuildConfig.APPLICATION_ID + ".provider", appFile);
            } else {
                uri = Uri.fromFile(appFile);
            }
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);
            finish();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // -----------------------Asynch
    // Task-----------------------------------------------//

    class DownloadFileFromURL extends AsyncTask<String, Integer, String> {

        /**
         * Before starting background thread Show Progress Bar Dialog
         */
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
//            progressBar = new ProgressDialog(AppDownloadActivity.this);
//            progressBar.setCancelable(false);
//            progressBar.setMessage("Downloading File...");
//            progressBar.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
//            Drawable customDrawable = getResources().getDrawable(
//                    R.drawable.custom_progressbar);
//            progressBar.setProgressDrawable(customDrawable);
//            progressBar.setMax(100);
//            progressBar.show();
            // ui change 11-01-2024
            mProgressBar.setVisibility(View.VISIBLE);
            percentageTextView.setVisibility(View.VISIBLE);
            if(Colorcode.equalsIgnoreCase(""))
            {
                mProgressBar.setProgressTintList(ColorStateList.valueOf(Color.parseColor("#e60000")));
            }
            else {
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
                request.setTitle(apkname);
                request.allowScanningByMediaScanner();
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setMimeType("application/vnd.android.package-archive");
                request.setVisibleInDownloadsUi(true);
                File sdcard = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);

                file = new File(sdcard, apkname);
                if (file.exists()) {
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, apkname);
                }

                if (!file.exists()) {
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, apkname);
                }

                final long downloadId = manager.enqueue(request);
                Log.d("##DOWNLOADID3", String.valueOf(downloadId));
                SharedPreferences.Editor editor = sharedpreferences.edit();
                editor.putLong("downloadId", downloadId);
                editor.commit();
                check = true;
                while (downloading && check) {

                    down(url_new, downloadId, manager);

                }

            } catch (Exception e) {
                Log.e("Error: ", e.toString());
            }

            return null;
        }

        @Override
        protected void onPostExecute(String file_url) {
            // dismiss the dialog after the file was downloaded

            // Displaying downloaded image into image view
            // Reading image path from sdcard

          //  progressBar.hide();
            mProgressBar.setVisibility(View.GONE);
//			if (file.length() == bytes_total) {
//				installApk();
//			} else {
//				Tryagain.setVisibility(View.VISIBLE);
//			}

        }

    }

    class DownloadFileFromURL1 extends AsyncTask<Long, Integer, Long> {

        /**
         * Before starting background thread Show Progress Bar Dialog
         */
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
//            progressBar = new ProgressBar(AppDownloadActivity.this);
////            progressBar.setCancelable(false);
////            progressBar.setMessage("Downloading Apk...");
////            progressBar.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
//            Drawable customDrawable = getResources().getDrawable(
//                    R.drawable.custom_progressbar);
//            progressBar.setProgressDrawable(customDrawable);
//            progressBar.setMax(100);
//            progressBar.show();
            // UI change 11-01-2024
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

        if(isGoBack)
        {
            Bundle b = new Bundle();
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_CANCELED, intent);
            this.finish();
        }
        else {

        }

    }


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
                percentageTextView.setText(String.valueOf( dl_progress) +"%");
            }
        });
        if (cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_SUCCESSFUL) {

            downloading = false;
            installApk();

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
                percentageTextView.setText(String.valueOf( dl_progress) +"%");
            }
        });

        if (cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)) == DownloadManager.STATUS_SUCCESSFUL) {

            downloading = false;
            installApk();

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

        ActivityCompat.requestPermissions(AppDownloadActivity.this,
                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE},
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
        new AlertDialog.Builder(AppDownloadActivity.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }
}

// --------------------------------------------------------------------------------------

