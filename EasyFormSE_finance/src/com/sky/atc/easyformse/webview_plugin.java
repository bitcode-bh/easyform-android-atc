package com.sky.atc.easyformse;


import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

import android.content.ActivityNotFoundException;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.StrictMode;
import androidx.core.content.FileProvider;
import android.webkit.MimeTypeMap;
import android.widget.Toast;

import com.sky.atc.easyformse.datautils.MySharedPreferences;

import net.sqlcipher.database.SQLiteDatabase;

import java.io.File;

import io.michaelrocks.paranoid.Obfuscate;

import static com.sky.atc.easyformse.sqlitewraper.context;



//open webview plugin
@Obfuscate
public class webview_plugin extends CordovaPlugin {


    public static final String TYPE_NONE = "NONE";
    private static final String LOG_TAG = "PhoneListener";

    private String phoneListenerCallbackId;

    BroadcastReceiver receiver;

    public CallbackContext callbackContext;
    MySharedPreferences pref;
//    Editor editor;
    
    SQLiteDatabase database;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        //to save storage key and value
        pref = sqlitewraper.getSecureShared("MyPref");
        database = sqlitewraper.getDatabase();

        String url = args.getJSONObject(0).getString("url");
        String _id = args.getJSONObject(0).getString("id");
        url=url.replace("\"","");
        this.callbackContext = callbackContext;

        if (action.equalsIgnoreCase("anAction")) {
//            Intent browserIntent = new Intent(this.cordova.getActivity(), webview_redirect.class);
//            browserIntent.putExtra("url", url);
//		browserIntent .setClass(sqlitewraper.context,signature.class);
//		browserIntent .setFlags(Intent.Fla);

//             open url redirect browser 03/02/2023
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            this.cordova.startActivityForResult(this, browserIntent, 0);
        }

        //Wipro sharepoint related
        if (action.equalsIgnoreCase("sharepoint")) {

            File file = new File(url);
            if (!file.exists()) {

                String t = "_id =" + _id;
                ContentValues c_val = new ContentValues();
                c_val.put("isdown_track", "0");
                long temp = database.update("download_video", c_val, t, null);

                callbackContext.sendPluginResult(new PluginResult(
                        PluginResult.Status.ERROR, "Error"));
            } else {

                String actual_namemime = url.replaceAll(" ", "");
                MimeTypeMap myMime = MimeTypeMap.getSingleton();
                Intent newIntent = new Intent(Intent.ACTION_VIEW);
                String mimeType = getMimeType(actual_namemime);
//                newIntent.setDataAndType(Uri.fromFile(file), mimeType);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {


                    StrictMode.VmPolicy.Builder builder = new StrictMode.VmPolicy.Builder();
                    StrictMode.setVmPolicy(builder.build());

                    newIntent.setDataAndType(Uri.fromFile(file), mimeType);

// newIntent.setDataAndType(FileProvider.getUriForFile(sqlitewraper.context, sqlitewraper.context.getPackageName() + ".provider",file),mimeType);
// newIntent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                }else {
                    newIntent.setDataAndType(Uri.fromFile(file), mimeType);
                }
                newIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    sqlitewraper.context.startActivity(newIntent);
                } catch (ActivityNotFoundException e) {
                    Toast.makeText(context, "No handler for this type of file.", Toast.LENGTH_LONG).show();
                }
            }
        }
//		if (action.equals("anAction")) {
//			Intent intent = new Intent(this.cordova.getActivity(),
//					CaptureSignature.class);
//			if (this.cordova != null) {
//				this.cordova.startActivityForResult(this, intent, 0);
//				return true;
//			}
//		}
        return true;
    }

    public static String getMimeType(String url) {
        String type = null;
        String extension = MimeTypeMap.getFileExtensionFromUrl(url);
        if (extension != null) {
            type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        }
        return type;
    }


    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 0:
                // retour de la version utilisant le sample de imense alpr
                if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok
//                    open url redirect browser 03/02/2023 so remove this code
//                    Bundle bundle = intent.getExtras();
//                    String status = bundle.getString("status");
//
//                    pref.putString("photo_path", status); // Saving string
//                    pref.commit(); // commit changes

                    this.callbackContext.success("Success");
                } else {
                 //   String message = intent.getStringExtra("result");
                    this.callbackContext.error("Error....");
                }
                break;
            default:
                break;
        }
    }


}