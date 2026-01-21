package com.sky.atc.easyformse;


import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import net.sqlcipher.database.SQLiteDatabase;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.FirebaseInstanceIdService;
import com.sky.atc.easyformse.datautils.MySharedPreferences;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;


@StringFogIgnore
//Class extending FirebaseInstanceIdService to receive token
public class MyFirebaseInstanceIDService extends FirebaseInstanceIdService {

    private static final String TAG = "MyFirebaseIIDService";

    SQLiteDatabase database;
    private final static String TOKEN_ID="TOKEN_ID";

    @Override
    public void onTokenRefresh() {
        database = sqlitewraper.getDatabase();

        //Getting registration token
        String refreshedToken = FirebaseInstanceId.getInstance().getToken();

        SharedPreferences sharedpreferences = getApplicationContext().getSharedPreferences("FCMTOKEN", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor1 = sharedpreferences.edit();
        editor1.putString("fcmtoken", refreshedToken);
        editor1.apply();




        Log.d("TEST_TEST", "refreshedToken : " + refreshedToken);
        Cursor c2 = database.rawQuery("select username,company_id from Login_Master",
                null);
        c2.moveToFirst();
        String nick1 = null;
        int c_id = 0;
        if (c2.getCount() > 0) {
            nick1 = c2.getString(0);
            c_id = c2.getInt(1);
        }
        c2.close();

        Log.d("TEST_TEST", "nick1-" + nick1);
        TelephonyManager telephonyManager = (TelephonyManager) sqlitewraper.context
                .getSystemService(Context.TELEPHONY_SERVICE);
        /*if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {

            return;
        }
        String imei = telephonyManager.getDeviceId();*/
//        Log.d("TEST_TEST","imei-"+imei);

        String version = null;
        try {
            version = sqlitewraper.context.getPackageManager()
                    .getPackageInfo(sqlitewraper.context.getPackageName(), 0).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            ////e.printStackTrace()();
        }

        try {

//            if (!nick1.equals("0")) {

                String t = "_id==1";
                ContentValues gcm = new ContentValues();
                gcm.put("gid", refreshedToken);
                gcm.put("username", nick1);
                gcm.put("imei", "0");
                gcm.put("date", System.currentTimeMillis());
                gcm.put("version", version);
                gcm.put("flag", "0");
                gcm.put("company_id", c_id);

                long insert = database.update("gcm_server", gcm, t, null);
                insert++;
//            }else {
//
//                Log.d("TEST_TEST","else : "+nick1);
//
//            }
            Intent i = new Intent(sqlitewraper.context, gcm_server.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, i);

        } catch (Exception e) {
            // TODO Auto-generated catch block
            ////e.printStackTrace()();
        }

        //Displaying token on logcat
        Log.d(TAG, "Refreshed token: " + refreshedToken);
//      SharedPreferences.Editor editor = getSharedPreferences(TOKEN_ID, MODE_PRIVATE).edit();
        MySharedPreferences meditor= sqlitewraper.getSecureShared(TOKEN_ID);
        meditor.putString("token",refreshedToken);
    }
}