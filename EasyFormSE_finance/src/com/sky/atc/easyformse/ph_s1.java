package com.sky.atc.easyformse;

import java.io.IOException;
import java.io.InputStream;

import android.os.Build;
import android.os.Bundle;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.view.Menu;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import org.apache.cordova.CordovaActivity;



import com.commonsware.cwac.wakeful.WakefulIntentService;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//to check on pending upload notification and call upload service
@StringFogIgnore
public class ph_s1 extends CordovaActivity {

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
//		super.setIntegerProperty("loadUrlTimeoutValue", 120000);
		
		// open page on notification click
		super.loadUrl("file:///android_asset/www2/pending_status.html");

		// upload files to server
		Intent i_ch2 = new Intent(sqlitewraper.context, f_upload_new_structure.class);
		WakefulIntentService.sendWakefulWork(sqlitewraper.context, i_ch2);
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
