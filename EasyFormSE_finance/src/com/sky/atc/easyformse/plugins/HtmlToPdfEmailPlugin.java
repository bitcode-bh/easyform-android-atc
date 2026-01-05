package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Environment;
import android.provider.Settings;

import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.io.File;
import java.io.FileOutputStream;

public class HtmlToPdfEmailPlugin extends CordovaPlugin {
    private static final int PERMISSION_REQUEST_CODE = 201;
    CallbackContext mCallbackContext;
    String html_string;
    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) {

        try {
            this.mCallbackContext  = callbackContext;
            html_string = args.getJSONObject(0).getString("html_string");

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

    private void createPdfAndEmail(String html) throws Exception {

        PdfDocument document = new PdfDocument();
        PdfDocument.PageInfo pageInfo =
                new PdfDocument.PageInfo.Builder(595, 842, 1).create();

        PdfDocument.Page page = document.startPage(pageInfo);

        page.getCanvas().drawText(
                android.text.Html.fromHtml(html).toString(),
                20, 50,
                new android.graphics.Paint()
        );

        document.finishPage(page);

        File pdfDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS) , "pdf");

        if (!pdfDir.exists()) pdfDir.mkdirs();

        File pdfFile = new File(pdfDir, "Safety_Passport.pdf");

        FileOutputStream fos = new FileOutputStream(pdfFile);
        document.writeTo(fos);
        document.close();
        fos.close();

        sendEmail(pdfFile);
    }

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
