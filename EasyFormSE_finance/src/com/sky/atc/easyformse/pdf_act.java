package com.sky.atc.easyformse;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.StrictMode;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


//To download PDF FILE
@StringFogIgnore
public class pdf_act extends Activity {
    private SQLiteDatabase database;
    ComponentName demoDeviceAdmin;
    static final int ACTIVATION_REQUEST = 47;


    TextView tv_loading;
    TextView pdfStarting;
    private boolean killMe;

    TextView tv_main;
    TextView tv_sub;
    ProgressBar pg_download;
    WebView wbpdf;
    String dest_file_path = "test.pdf";
    int downloadedSize = 0, totalsize;
    String download_file_url = "";
    float per = 0;
    String pdf_path;
    String name;
//    SharedPreferences.Editor editor;
    MySharedPreferences pref;
    File path;
    private DownloadFileFromURL task;
    String extension;
    private static final int PERMISSION_REQUEST_CODE = 201;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.pdf_down);

        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
                .permitAll().build();

        StrictMode.setThreadPolicy(policy);
        if (checkPermission()) {
            calldowloadpdf();
        } else {
            requestPermission();
        }

    }

    public void calldowloadpdf()
    {//main logic or main code
        Intent in = getIntent();
        download_file_url = in.getStringExtra("path");
        name = in.getStringExtra("name");
        // name string is blank it is consider .pdf extension
        if(name.equalsIgnoreCase(""))
        {
            name = ".pdf";
        }
        pref = sqlitewraper.getSecureShared("MyPref");
//        editor = pref.edit();
        pref.putString("pdf_path", ""); // Saving string
        pref.commit();

        tv_main = (TextView) findViewById(R.id.txtdwn_main);
        tv_sub = (TextView) findViewById(R.id.txtdwn_sub);
        pdfStarting = (TextView) findViewById(R.id.starting_pdf);
        pdfStarting.setText("Download Starting...");
        pdfStarting.setGravity(Gravity.CENTER);
        pdfStarting.setTypeface(null, Typeface.BOLD);

        pg_download = (ProgressBar) findViewById(R.id.pgpdf);

        task = new DownloadFileFromURL();
        task.execute("");

    }
    class DownloadFileFromURL extends AsyncTask<String, String, String> {

        /**
         * Before starting background thread Show Progress Bar Dialog
         */
        @Override
        protected void onPreExecute() {
            super.onPreExecute();

        }

        /**
         * Downloading file in background thread
         */
        @Override
        protected String doInBackground(String... f_url) {
            int count;
            File file = null;
            try {

                URL url = new URL(download_file_url);
                HttpURLConnection urlConnection = (HttpURLConnection) url
                        .openConnection();

                urlConnection.setRequestMethod("GET");
                urlConnection.setDoOutput(false);

                // connect
                urlConnection.connect();


                File folder = new File(com.sky.atc.easyformse.utils.AppStorage.root().toString() + "/Easy_form_pdf");
                folder.mkdirs();


                 extension = name.substring(name.lastIndexOf("."));
                // set the path where we want to save the file
                dest_file_path = (String.valueOf(System.currentTimeMillis())) + extension;

                // create a new file, to save the downloaded file
                file = new File(folder.toString(), dest_file_path);

                FileOutputStream fileOutput = new FileOutputStream(file);

                // Stream used for reading the data from the internet
                InputStream inputStream = urlConnection.getInputStream();

                // this is the total size of the file which we are
                // downloading
                totalsize = urlConnection.getContentLength();
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        setText("Starting PDF download...", 0);
                    }
                });


                // create a buffer...
                byte[] buffer = new byte[1024 * 1024];
                int bufferLength = 0;

                while ((bufferLength = inputStream.read(buffer)) > 0) {
                    fileOutput.write(buffer, 0, bufferLength);
                    downloadedSize += bufferLength;
                    per = ((float) downloadedSize / totalsize) * 100;
//                setText("Total PDF File size  : "
//                        + (totalsize / 1024)
//                        + " KB\n\nDownloading PDF " + (int) per
//                        + "% complete");

                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            setText("Total PDF File size  : "
                                    + (totalsize / 1024)
                                    + " KB", 4);

                            setText("Total PDF File size  : "
                                    + (totalsize / 1024)
                                    + " KB", 0);
                            setText("Downloading PDF " + (int) per
                                    + "% complete", 1);

                            setText("", 5);

                            setpg((int) per);


                        }
                    });

                }
                // close the output stream when complete //
                fileOutput.close();
                path = file
                ;
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {

                        setText("Download Complete. Open PDF Application installed in the device.", 1);
                    }
                });


            } catch (final MalformedURLException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
					

                        setTextError("Some error occured. Press back and try again.", Color.RED);
                    }
                });
            } catch (final IOException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        setTextError("Some error occured. Press back and try again.", Color.RED);
                    }
                });
            } catch (final Exception e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        setTextError("Failed to download image. Please check your internet connection.", Color.RED);
                    }
                });
            }

            return null;
        }


        /**
         * Updating progress bar
         */
        protected void onProgressUpdate(String... progress) {
            // setting progress percentage

        }

        /**
         * After completing background task Dismiss the progress dialog
         **/

        @Override
        protected void onPostExecute(String file_url) {
            // dismiss the dialog after the file was downloaded

            // Displaying downloaded image into image view
            // Reading image path from sdcard
            Uri path1 = null;
            try {
            pref.putString("pdf_path", path.getAbsolutePath()); // Saving string
            pref.commit();

            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                if (Build.VERSION.SDK_INT >= 24) {
                    path1 = FileProvider.getUriForFile(getApplicationContext(), BuildConfig.APPLICATION_ID + ".provider", new File(path.getAbsolutePath()));
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } else {
                    path1 = Uri.fromFile(path);

                }
                if(extension.contains(".pdf"))
                {
                    intent.setDataAndType(path1, "application/pdf");
                }
                else if(extension.contains(".jpg") || extension.contains(".jpeg") || extension.contains(".png")){
                    intent.setDataAndType(path1, "image/*");
                }
                else if (extension.contains(".doc") || extension.contains(".docx")) {
                    intent.setDataAndType(path1, "application/msword");
                }
                else if (extension.contains(".xls") || extension.contains(".xlsx")) {
                    intent.setDataAndType(path1, "application/vnd.ms-excel");
                }
                else if (extension.contains(".txt")) {
                    intent.setDataAndType(path1, "text/*");
                }
                else if (extension.contains(".wav") || extension.contains(".mp3")) {
                    intent.setDataAndType(path1, "audio/*");
                }
                else if (extension.contains(".3gp") || extension.contains(".mpg") ||
                        extension.contains(".mpeg") || extension.contains(".mpe") || extension.contains(".mp4") || extension.contains(".avi")) {
                    intent.setDataAndType(path1, "video/*");
                }
                else {
                    intent.setDataAndType(path1, "*/*");
                }
//                    intent.setFlags(Intent.F);
                startActivityForResult(intent, 101);
                finish();
            } catch (ActivityNotFoundException e) {
                tv_sub.setError("PDF Reader application is not installed in your device");
            }

        }
        catch (Exception e){
                e.printStackTrace();
                setTextError("Something goes wrong",Color.RED);
            }
        }
    }


    void setTextError(final String message, final int color) {

        tv_sub.setTextColor(color);
        tv_sub.setText(message);


    }

    void setText(final String txt, final int i) {
        {
            if (i == 0) {

                tv_main.setText(txt);
            }

            if (i == 1) {
                tv_sub.setText(txt);
            }

            if (i == 4) {

                tv_sub.setVisibility(View.VISIBLE);
            }
            if (i == 5) {
                pdfStarting.setVisibility(View.INVISIBLE);
            }

        }


    }


    void setpg(final int i) {
        pg_download.setProgress(i);

    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        System.out.print("return");
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        task.cancel(true);
        finish();

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

        ActivityCompat.requestPermissions(pdf_act.this,
                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE},
                PERMISSION_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
        switch (requestCode) {
            case PERMISSION_REQUEST_CODE:
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                        && grantResults[1] == PackageManager.PERMISSION_GRANTED) {
                    // Toast.makeText(getApplicationContext(), "Permission Granted", Toast.LENGTH_SHORT).show();
                    calldowloadpdf();
                    // main logic
                } else {
                    // Toast.makeText(getApplicationContext(), "Permission Denied", Toast.LENGTH_SHORT).show();
                    if ( ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

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
        new AlertDialog.Builder(pdf_act.this)
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }

}

