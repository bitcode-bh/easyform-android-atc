package com.sky.atc.easyformse;

import java.io.IOException;
import java.io.InputStream;

import android.content.SharedPreferences;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.os.Build;
import android.os.Bundle;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.view.Menu;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;


import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import org.apache.cordova.CordovaActivity;

import io.michaelrocks.paranoid.Obfuscate;

//to open selection view from push data
@Obfuscate
public class select_view extends CordovaActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bundle b = this.getIntent().getExtras();

        String flow_id = b.getString("flow_id", "");
        String udf_id = b.getString("udf_id", "");
        SQLiteDatabase database = sqlitewraper.getDatabase();

        Cursor c = database
                .rawQuery(
                        "select flow_id, id, flow_name, type, data from user_define_flow_master where flow_id="
                                + flow_id + " and id =" + udf_id, null);
        c.moveToFirst();
        String flow_id1 = "";
        String flow_name = "";
        String flow_type = "";
        String udf_data = "";
        if (c.getCount() > 0) {
            flow_id1 = c.getString(0);
            udf_id = c.getString(1);
            flow_name = c.getString(2);
            flow_type = c.getString(3);
            udf_data = c.getString(4);
        }

        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
//        SharedPreferences.Editor editor = pref.edit();
        pref.putString("flow_id", flow_id1);
        pref.putString("udf_id", udf_id);
        pref.putString("flow_name", flow_name);
        pref.putString("flow_type", flow_type);
        pref.putString("udf_data", udf_data);
        pref.commit();

//		super.setIntegerProperty("loadUrlTimeoutValue", 120000);
        super.loadUrl("file:///android_asset/www2/selection.html"); // default
        // application
        // page (first)
    }

    public void onReceivedError(int errorCode, String description,
                                String failingUrl) {

        if (failingUrl.contains("?")) {
            Log.v("LOG", "failing url:" + failingUrl);
            final int sdkVersion = Integer.parseInt(Build.VERSION.SDK);
            if (sdkVersion > 9) {

                this.loadUrl(failingUrl);
            } else {
                this.loadUrl("file:///android_asset/tableofcontents.html");
            }

        }
        return;

    }

}
