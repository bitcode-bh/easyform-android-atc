package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.print.PrintAttributes;
import android.provider.Settings;
import android.webkit.WebView;

import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.tool.xml.XMLWorkerHelper;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;

public class HtmlToPdfEmailPlugin extends CordovaPlugin {
    private static final int PERMISSION_REQUEST_CODE = 201;
    CallbackContext mCallbackContext;
    String html_string;
    private SQLiteDatabase database;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) {

        try {
            this.mCallbackContext  = callbackContext;
            database = sqlitewraper.getDatabase();
            html_string = "<html>\n" +
                    "<body>\n" +
                    "<h2>Safety Passport</h2>\n" +
                    "<img width=\"300\"\n" +
                    "src=\"https://www.gstatic.com/webp/gallery/4.sm.jpg\"/>\n" +
                    "<p>Generated from Cordova</p>\n" +
                    "</body>\n" +
                    "</html>\n";

            if (checkPermission())
            {
                createPdfAndEmail(html_string);
                this.mCallbackContext.success("OK");
                return true;
            }
            else {
                requestPermission();
                return false;
            }

        } catch (Exception e) {
            this.mCallbackContext.error(e.getMessage());
            return false;
        }


    }


    private void createPdfAndEmail(String html) throws IOException, DocumentException {

        File pdfDir = new File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS),
                "Easyform_pdf"
        );
        if (!pdfDir.exists()) pdfDir.mkdirs();

        Cursor c3 = database.rawQuery("SELECT username FROM Login_Master",
                null);
        c3.moveToLast();
        String username = c3.getString(0);

        c3.close();
        String pdfname = "Safety_Passport_" +username +".pdf" ;
       File pdfFile = new File(pdfDir, pdfname);

        OutputStream file = new FileOutputStream(pdfFile);
        Document document = new Document();
        PdfWriter writer = PdfWriter.getInstance(document, file);
        document.open();
        InputStream is = new ByteArrayInputStream(html.getBytes("UTF-8"));
        XMLWorkerHelper.getInstance().parseXHtml(writer, document, is,null,
                Charset.forName("UTF-8"));
        document.close();
        file.close();
        sendEmail(pdfFile);
    }

//    public File downloadPdf(Context context, String pdfUrl) throws IOException {
//
//        URL url = new URL(pdfUrl);
//        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
//        connection.connect();
//
//        InputStream input = new BufferedInputStream(connection.getInputStream());
//
//        File pdfFile = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS) , "Easyform_Pdf");
//        if (!pdfFile.exists()) pdfFile.mkdirs();
//
//        Cursor c3 = database.rawQuery("SELECT username FROM Login_Master",
//                null);
//        c3.moveToLast();
//        String username = c3.getString(0);
//
//        c3.close();
//        String pdfname = "Safety_Passport_" +username +".pdf" ;
//        pdfFile = new File(pdfFile, pdfname);
//
//        OutputStream output = new FileOutputStream(pdfFile);
//
//        byte[] buffer = new byte[1024];
//        int count;
//        while ((count = input.read(buffer)) != -1) {
//            output.write(buffer, 0, count);
//        }
//
//        output.flush();
//        output.close();
//        input.close();
//        connection.disconnect();
//
//        return pdfFile;
//    }


//    private void createPdfAndEmail(String html) throws Exception {
//
//        PdfDocument document = new PdfDocument();
//        PdfDocument.PageInfo pageInfo =
//                new PdfDocument.PageInfo.Builder(595, 842, 1).create();
//
//        PdfDocument.Page page = document.startPage(pageInfo);
//
//        page.getCanvas().drawText(
//                android.text.Html.fromHtml(html).toString(),
//                20, 50,
//                new android.graphics.Paint()
//        );
//
//        document.finishPage(page);
//
//        File pdfDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS) , "Easyform_pdf");
//
//        if (!pdfDir.exists()) pdfDir.mkdirs();
//
//        File pdfFile = new File(pdfDir, "Safety_Passport.pdf");
//
//        FileOutputStream fos = new FileOutputStream(pdfFile);
//        document.writeTo(fos);
//        document.close();
//        fos.close();
//
//        sendEmail(pdfFile);
//    }

    private void sendEmail(File pdfFile) {

        Uri uri = FileProvider.getUriForFile(
                cordova.getActivity(),
                cordova.getActivity().getPackageName() + ".provider",
                pdfFile
        );

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("application/pdf");
        intent.putExtra(Intent.EXTRA_SUBJECT, "Safety Passport");
        intent.putExtra(Intent.EXTRA_TEXT, "Please find attached invoice.");
        intent.putExtra(Intent.EXTRA_STREAM, uri);
        intent.addFlags( Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);

        cordova.getActivity().startActivity(
                Intent.createChooser(intent, "Send Email")
        );
    }



    private boolean checkPermission() {
        return ContextCompat.checkSelfPermission(
                cordova.getActivity(),
                Manifest.permission.WRITE_EXTERNAL_STORAGE
        ) == PackageManager.PERMISSION_GRANTED;
    }


    private void requestPermission() {

        cordova.requestPermissions(this,PERMISSION_REQUEST_CODE,
                new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE});
    }
    @Override
    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) throws JSONException {
        try {
            if (requestCode == PERMISSION_REQUEST_CODE) {
                if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    // Permission granted, handle accordingly
                    createPdfAndEmail(html_string);
                    this.mCallbackContext.success("OK");
                } else {
                    if ( ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.WRITE_EXTERNAL_STORAGE) +
                            ContextCompat.checkSelfPermission(this.cordova.getActivity(), Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)  {

                        showMessageOKCancel("You need to allow access file and media permissions",
                                new DialogInterface.OnClickListener() {
                                    @Override
                                    public void onClick(DialogInterface dialog, int which) {
                                        Intent intent = new Intent();
                                        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                                        intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                                        mainactivity.startActivity(intent);
                                        //finish();
                                    }
                                });

                    }

                }
            }
        }
        catch (Exception e)
        {
//            Log.d("Exception",e.toString());
        }
    }
    private void showMessageOKCancel(String message, DialogInterface.OnClickListener okListener) {
        new AlertDialog.Builder(this.cordova.getActivity())
                .setMessage(message)
                .setPositiveButton("OK", okListener)
                .setCancelable(false)
                .create()
                .show();
    }
}
