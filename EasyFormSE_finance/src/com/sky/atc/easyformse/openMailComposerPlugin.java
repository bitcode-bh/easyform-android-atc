package com.sky.atc.easyformse;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.List;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//open main composer
@StringFogIgnore
public class openMailComposerPlugin extends CordovaPlugin {



    public CallbackContext callbackContext;
    SQLiteDatabase database;

    @Override
    public boolean execute(String action, JSONArray args,
                           CallbackContext callbackContext) throws JSONException {

        this.callbackContext = callbackContext;

        try {

            String email = args.getJSONObject(0).getString("email");
            String subject = args.getJSONObject(0).getString("subject");
            String body = args.getJSONObject(0).getString("body");

            if (subject == null) {

                subject = "";
            }
            if (body == null) {
                body = "";
            }

            if (email != null) {

                Intent sharingIntent = new Intent(android.content.Intent.ACTION_SEND);
                sharingIntent.setType("text/plain");
                String[] shareEmail = {email};
                String shareBody = body;
                String shareSub = subject;
                sharingIntent.putExtra(Intent.EXTRA_EMAIL, shareEmail);
                sharingIntent.putExtra(android.content.Intent.EXTRA_SUBJECT, shareSub);
                sharingIntent.putExtra(android.content.Intent.EXTRA_TEXT, shareBody);
                this.cordova.startActivityForResult(this, Intent.createChooser(sharingIntent, "Share with"), 0);

//                Intent intent = new Intent(Intent.ACTION_SEND);
//                String[] recipients = {email};
//                intent.putExtra(Intent.EXTRA_EMAIL, recipients);
//                intent.putExtra(Intent.EXTRA_SUBJECT, subject);
//                intent.putExtra(Intent.EXTRA_TEXT, body);
//                intent.setType("text/html");
//
//                final PackageManager pm = this.cordova.getActivity().getPackageManager();
//                final List<ResolveInfo> matches = pm.queryIntentActivities(intent, 0);
//
//                ResolveInfo best = null;
//                for (final ResolveInfo info : matches)
//                    if (info.activityInfo.packageName.endsWith(".gm") || info.activityInfo.name.toLowerCase().contains("gmail"))
//                        best = info;
//                if (best != null)
//                    intent.setClassName(best.activityInfo.packageName, best.activityInfo.name);
//
//                if (this.cordova != null) {
//                    this.cordova.startActivityForResult(this, Intent.createChooser(intent, "Send mail"), 0);
//                    return true;
//                }
            }

        } catch (Exception e) {
            ////e.printStackTrace()();
        }
        return false;
    }
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        switch (requestCode) {
            case 0:
                if (resultCode == android.app.Activity.RESULT_OK) { // 0:ok

                    this.callbackContext.success("Success");

                } else {

                    this.callbackContext.error("Error...");
                }

                break;
            default:
                break;
        }
		
    }
}
