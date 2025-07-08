package com.sky.atc.easyformse;

import java.util.Date;

import com.commonsware.cwac.wakeful.WakefulIntentService;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.text.format.Time;
import android.util.Log;
import android.widget.Toast;

import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
public class UpdateReceiver extends BroadcastReceiver {

	@Override
	public void onReceive(Context context, Intent intent) {

		ConnectivityManager connectivityManager = (ConnectivityManager) context
				.getSystemService(Context.CONNECTIVITY_SERVICE);
		NetworkInfo activeNetInfo = connectivityManager
				.getNetworkInfo(ConnectivityManager.TYPE_MOBILE);
		NetworkInfo activeNetInfo_wifi = connectivityManager
				.getNetworkInfo(ConnectivityManager.TYPE_WIFI);
		boolean isConnected = activeNetInfo != null
				&& activeNetInfo.isConnected();
		boolean isConnected_wifi = activeNetInfo_wifi != null
				&& activeNetInfo_wifi.isConnected();
		if (isConnected || isConnected_wifi) {
			sqlitewraper.internetflag = 1;


			Log.i("NET", "connecte" + isConnected + "-" + isConnected_wifi);
		}

		else {
			sqlitewraper.internetflag = 0;

			Log.i("NET", "not connecte" + isConnected);
		}
	}

}