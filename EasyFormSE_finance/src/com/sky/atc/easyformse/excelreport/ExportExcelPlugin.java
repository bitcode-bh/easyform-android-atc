package com.sky.atc.easyformse.excelreport;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.os.StrictMode;
import androidx.core.content.FileProvider;
import android.util.Log;
import android.widget.Toast;

import com.itextpdf.text.Document;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.tool.xml.XMLWorkerHelper;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.sqlitewraper;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Iterator;
import java.util.Locale;

import jxl.CellView;
import jxl.Workbook;
import jxl.WorkbookSettings;
import jxl.format.Border;
import jxl.format.BorderLineStyle;
import jxl.format.Colour;
import jxl.write.Label;
import jxl.write.WritableCellFormat;
import jxl.write.WritableFont;
import jxl.write.WritableSheet;
import jxl.write.WritableWorkbook;

import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.webview_plugin.getMimeType;


//To Generate and Export PDF and Excle
public class ExportExcelPlugin extends CordovaPlugin {


    public CallbackContext callbackContext;
    private WritableWorkbook workbook;


    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;

        try {

            String type = args.getJSONObject(0).getString("type");
            String dataString = args.getJSONObject(0).getString("datastring");

//            createExcelSheet(type,dataString);
        } catch (Exception e) {
            this.callbackContext.error(e.getMessage());
        }
        return true;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == 104) {

            try {
                if (callbackContext != null) {

                    if (resultCode == Activity.RESULT_OK) {

                        this.callbackContext.success("sucess");

                    } else {

                        this.callbackContext.error("error");
                    }
                } else {

                    DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
                }
            } catch (Exception e) {

                DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);
            }
        }
    }


    private void createExcelSheet(String type,String dataString) {

        File directory, sd, file, file2;

        String csvFile = "EASYFORM_" + System.currentTimeMillis() + ".xls";
        String csvFile2 = "EASYFORM_" + System.currentTimeMillis() + ".pdf";
        sd = createDirIfNotExists();
        directory = new File(sd.getAbsolutePath());
        file = new File(directory, csvFile);
        file2 = new File(directory, csvFile2);
        WorkbookSettings wbSettings = new WorkbookSettings();
        wbSettings.setLocale(new Locale("en", "EN"));
        try {

            if (type.equalsIgnoreCase("pdf")) {

                htmalToPdf(file2.getAbsolutePath(),dataString);
                openFileAction(file2);
            }
            if (type.equalsIgnoreCase("excel")) {

                workbook = Workbook.createWorkbook(file, wbSettings);
                createFirstSheet(dataString);
                workbook.write();
                workbook.close();
                openFileAction(file);
            }
            this.callbackContext.success("sucess");

        } catch (Exception e) {
            this.callbackContext.error("error");
            e.printStackTrace();
        }
    }

    private void createFirstSheet(String jsonString) {


        try {

            WritableSheet sheet = workbook.createSheet("sheet1", 0);

            JSONArray jsonArray = new JSONArray(jsonString);


            for (int i = 0; i < jsonArray.length(); i++) {

                JSONObject issueObj = jsonArray.getJSONObject(i);

                Iterator iterator = issueObj.keys();
                int j = 0;
                while (iterator.hasNext()) {

                    String key = (String) iterator.next();
                    String _pubKey = issueObj.optString(key);

                    WritableFont cellFont = new WritableFont(WritableFont.COURIER, 12);
                    cellFont.setBoldStyle(WritableFont.BOLD);
                    cellFont.setColour(Colour.WHITE);

                    CellView columnAView = new CellView();
                    columnAView.setAutosize(true);

                    sheet.setColumnView(j, columnAView);

                    WritableCellFormat cellFormat = new WritableCellFormat(cellFont);
                    cellFormat.setBackground(Colour.RED);
                    cellFormat.setAlignment(jxl.format.Alignment.CENTRE);
                    cellFormat.setBorder(Border.ALL, BorderLineStyle.MEDIUM);

                    sheet.addCell(new Label(j, 0, key, cellFormat));
                    sheet.addCell(new Label(j, i + 1, _pubKey));

                    Log.d("##", "");
                    j++;
                }

            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static File createDirIfNotExists() {

        File file = new File(Environment.getExternalStorageDirectory(), "Easform Reports");
        if (!file.exists()) {
            if (!file.mkdirs()) {
                Log.e("TravellerLog :: ", "Problem creating Image folder");
            }
        }
        return file.getAbsoluteFile();
    }

    private void openFileAction(File file) {

        String url = file.getAbsolutePath();

        if (!file.exists()) {
            callbackContext.sendPluginResult(new PluginResult(
                    PluginResult.Status.ERROR, "Error"));
        } else {

            String actual_namemime = url.replaceAll(" ", "");
            Intent newIntent = new Intent(Intent.ACTION_VIEW);
            String mimeType = getMimeType(actual_namemime);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {


                StrictMode.VmPolicy.Builder builder = new StrictMode.VmPolicy.Builder();
                StrictMode.setVmPolicy(builder.build());

                newIntent.setDataAndType(Uri.fromFile(file), mimeType);

//                newIntent.setDataAndType(FileProvider.getUriForFile(sqlitewraper.context, sqlitewraper.context.getPackageName() + ".provider",file),mimeType);
//                newIntent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            }else {
                newIntent.setDataAndType(Uri.fromFile(file), mimeType);
            }
            newIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                sqlitewraper.context.startActivity(newIntent);
            } catch (ActivityNotFoundException e) {
                Toast.makeText(context, "No handler found for this type of file in your Device.", Toast.LENGTH_LONG).show();
            }
        }
    }


    private void htmalToPdf(String file1,String k) {

        try {

            OutputStream file = new FileOutputStream(new File(file1));
            Document document = new Document();
            PdfWriter writer = PdfWriter.getInstance(document, file);
            document.open();
            InputStream is = new ByteArrayInputStream(k.getBytes());
            XMLWorkerHelper.getInstance().parseXHtml(writer, document, is);
            document.close();
            file.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
