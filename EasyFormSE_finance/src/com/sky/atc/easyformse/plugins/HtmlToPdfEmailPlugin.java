package com.sky.atc.easyformse.plugins;

import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Picture;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.sky.atc.easyformse.sqlitewraper;
import net.sqlcipher.database.SQLiteDatabase;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;


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
            html_string = args.getJSONObject(0).getString("html_string");

            if (checkPermission()) {
                cordova.getActivity().runOnUiThread(() -> {
                    createPdfAndEmail(html_string);
                    this.mCallbackContext.success("OK");
                });
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


    private void createPdfAndEmail(String html)  {

        try{
            Cursor c3 = database.rawQuery("SELECT username FROM Login_Master",
                    null);
            c3.moveToLast();
            String username = c3.getString(0);

            c3.close();


            WebView webView = new WebView(sqlitewraper.context);

            webView.setLayoutParams(new ViewGroup.LayoutParams(900, 1200)); // set size as per need
            webView.measure(View.MeasureSpec.makeMeasureSpec(900, View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(1200, View.MeasureSpec.EXACTLY));
            webView.layout(0, 0, 900, 1200);
            html = makeXhtmlSafe(html);
            webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);

            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    // Take snapshot of WebView

                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        Picture picture = webView.capturePicture();
                        Bitmap bitmap = Bitmap.createBitmap(picture.getWidth(),
                                picture.getHeight(),
                                Bitmap.Config.ARGB_8888);
                        Canvas canvas = new Canvas(bitmap);
                        canvas.drawColor(Color.WHITE);
                        picture.draw(canvas);

                        // Create PDF document
                        PdfDocument pdfDocument = new PdfDocument();
                        PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(bitmap.getWidth(), bitmap.getHeight(), 1).create();
                        PdfDocument.Page page = pdfDocument.startPage(pageInfo);
                        Canvas pdfCanvas = page.getCanvas();

                        pdfCanvas.drawBitmap(bitmap, 0, 0, null);
                        pdfDocument.finishPage(page);

                        // Save PDF to file
                        File pdfDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), "Easyform_pdf");
                        if (!pdfDir.exists()) pdfDir.mkdirs();
                        String pdfname = "Safety_Passport_" + username + ".pdf";
                        File pdfFile = new File(pdfDir, pdfname);

                        try {
                            FileOutputStream out = new FileOutputStream(pdfFile);
                            pdfDocument.writeTo(out);
                            pdfDocument.close();
                            out.close();

                            sendEmail( pdfFile);
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }, 1000);

                }
            });
        }
        catch (Exception e)
        {

        }
    }




    private String makeXhtmlSafe(String html) {

        html = html.replaceAll("<img([^>]*?)(?<!/)>", "<img$1 />");
        html = html.replaceAll("<br>", "<br />");
        html = html.replaceAll("<hr>", "<hr />");
        html = html.replaceAll("<input([^>]*?)(?<!/)>", "<input$1 />");
        html = html.replaceAll("<meta([^>]*?)(?<!/)>", "<meta$1 />");
        html = html.replaceAll("<link([^>]*?)(?<!/)>", "<link$1 />");

        return html;
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
