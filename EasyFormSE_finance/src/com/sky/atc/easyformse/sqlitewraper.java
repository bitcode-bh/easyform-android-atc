package com.sky.atc.easyformse;


import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;

import net.sqlcipher.database.SQLiteDatabase;

import android.location.Criteria;
import android.location.Location;
import android.location.LocationManager;
import android.os.AsyncTask;

import androidx.multidex.MultiDex;
import androidx.multidex.MultiDexApplication;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;

import com.google.android.gms.ads.identifier.AdvertisingIdClient;
import com.google.android.gms.common.GooglePlayServicesNotAvailableException;
import com.google.android.gms.common.GooglePlayServicesRepairableException;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.geofencenew.GoogleApiHelper;

import java.io.IOException;
import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//APPLICATION CLASS TO INTIALIZE THE VALUSES LIKE DATABASE

@StringFogIgnore
public class sqlitewraper extends MultiDexApplication {

    /**
     * see NotePad tutorial for an example implementation of DataDbAdapter
     */
    private static MySQLiteHelper mDbHelper;
    public static Context context;
    public static int internetflag = 1;
    public static Double deg = (double) -1;
    public static int fakeflag = 0;
    public static Activity mainactivity;
    static String pass;
    //    static  SecurePreferences preferences;
    static MySharedPreferences preferences;
    private GoogleApiHelper googleApiHelper;
    private static sqlitewraper mInstance;
    static String imeino;

    public static Activity getMainactivity() {
        return mainactivity;
    }

    public static void setMainactivity(Activity mainactivity) {
        sqlitewraper.mainactivity = mainactivity;
    }

    /**
     * Called when the application is starting, before any other
     * application objects have been created. Implementations
     * should be as quick as possible...
     */
    @Override
    public void onCreate() {
        super.onCreate();

        mDbHelper = new MySQLiteHelper(this);
        context = this;
        MultiDex.install(this);
        SQLiteDatabase.loadLibs(context);

        pass = String.valueOf(System.currentTimeMillis());
//        preferences = sqlitewraper.context.getSharedPreferences("my-preferences", 0);
        preferences = MySharedPreferences.getInstance(this, "my-preferences");


        //FOR GEOFENCE
        mInstance = this;
        googleApiHelper = new GoogleApiHelper(mInstance);
        // AppBrain.initApp(this);

        if (imeino == null) {
            new AsyncTaskRunner().execute();
        }
        isMockAvailable = false;

        com.sky.atc.easyformse.utils.EdgeToEdgeOptOut.install(this);
        new Thread(com.sky.atc.easyformse.utils.AppStorage::root, "storage-check").start();

        /*Log.d("fakeLocationFlag", fakeLocationFlag + " ");
        if (fakeLocationFlag.equalsIgnoreCase("true")) {
            setFakeflag(0);
        } else {
            setFakeflag(1);
        }*/
    }

    public static boolean isMockAvailable(Location location, Context context) {

        boolean mock = false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
            mock = location.isFromMockProvider();
        } else {
            mock = !Settings.Secure.getString(context.getContentResolver(), "mock_location").equals("0");
        }

        return mock;
    }

    /** Set from the last fix the location service received. */
    public static volatile boolean isMockAvailable = false;

    @SuppressLint("MissingPermission")
    /** One look at the last known location when a screen opens; the location service keeps the flag current. */
    public static void checkIsFakeLocation(Context context) {
        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        Criteria criteria = new Criteria();
        criteria.setAccuracy(Criteria.ACCURACY_LOW);
        criteria.setPowerRequirement(Criteria.POWER_LOW);
        Log.d("checkIsFakeLocation All: ", locationManager.getAllProviders() + "");
        String provider = locationManager.getBestProvider(criteria, true);
        if (provider != null && !provider.equalsIgnoreCase("")) {
            Location lastLocation = locationManager.getLastKnownLocation(provider);
            if (lastLocation != null) {
                isMockAvailable = sqlitewraper.isMockAvailable(lastLocation, sqlitewraper.context);
                Log.d("checkIsFakeLocation if: ", isMockAvailable + "");
            } else {
                Log.d("checkIsFakeLocation else: ", "null ");
            }
        } else {
            Log.d("checkIsFakeLocation provider: ", provider + "");
        }
    }


    /**
     * Called when the application is stopping. There are no more
     * application objects running and the process will exit.
     * Note: never depend on this method being called; in many
     * cases an unneeded application process will simply be killed
     * by the kernel without executing any application code...
     */
    @Override
    public void onTerminate() {
        super.onTerminate();
        mDbHelper.close();
        mDbHelper = null;
    }

    public static SQLiteDatabase getDatabase() {

        SQLiteDatabase database = null;
        try {
            database = mDbHelper.getWritableDatabase("sky989844");
        } catch (Exception e) {
            Log.d("##AAA", e.getMessage());
            database = mDbHelper.getWritableDatabase("");
        }
        return database;
    }

    public static int getFakeflag() {
        return fakeflag;
    }

    public static void setFakeflag(int fakeflag) {
        sqlitewraper.fakeflag = fakeflag;
    }


    //FOR GEOFENCE
    public GoogleApiHelper getGoogleApiHelperInstance() {
        return this.googleApiHelper;
    }

    public static GoogleApiHelper getGoogleApiHelper() {
        return getInstance().getGoogleApiHelperInstance();
    }

    public static synchronized sqlitewraper getInstance() {
        return mInstance;
    }

    public static MySharedPreferences getSecureShared(String MYPRERENCENAME) {

        return MySharedPreferences.getInstance(context, MYPRERENCENAME);
    }


    private static class AsyncTaskRunner extends AsyncTask<String, String, String> {


        @Override
        protected String doInBackground(String... params) {

            // Same id as everywhere else (see DeviceEventsUtils.getImei), not the raw advertising id.
            try {
                return DeviceEventsUtils.getImei();
            } catch (Exception e) {
                e.printStackTrace();
                return "";
            }

        }


        @Override
        protected void onPostExecute(String result) {
            Log.d("adid", "" + result);
            imeino = result;
        }


        @Override
        protected void onPreExecute() {

        }

        @Override
        protected void onProgressUpdate(String... text) {

        }
    }

}
