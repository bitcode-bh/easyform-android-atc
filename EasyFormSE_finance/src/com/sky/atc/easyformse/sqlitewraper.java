package com.sky.atc.easyformse;


import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;

import net.sqlcipher.database.SQLiteDatabase;

import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
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
import io.michaelrocks.paranoid.Obfuscate;

//APPLICATION CLASS TO INTIALIZE THE VALUSES LIKE DATABASE

@Obfuscate
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

    static LocationListener mLocationListener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            isMockAvailable = sqlitewraper.isMockAvailable(location, sqlitewraper.context);
            Log.d("checkIsFakeLocation lChanged: ", isMockAvailable + "");
        }

        @Override
        public void onStatusChanged(String provider, int status, Bundle extras) {
            Log.d("checkIsFakeLocation sChanged: ", provider + " " + status + "" + extras.toString());
        }

        @Override
        public void onProviderEnabled(String provider) {
            Log.d("checkIsFakeLocation Enabled: ", provider);
        }

        @Override
        public void onProviderDisabled(String provider) {
            Log.d("checkIsFakeLocation Disabled: ", provider);
        }
    };
   public static Boolean isMockAvailable = false;

    @SuppressLint("MissingPermission")
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
            locationManager.requestLocationUpdates(provider, 1L, 1f, mLocationListener);
        } else {
            Log.d("checkIsFakeLocation provider: ", provider + "");
            /*if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1L, 1f, mLocationListener);
            }else {
                Log.d("checkIsFakeLocation isProviderEnabled: ", provider + "");
            }*/
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

            AdvertisingIdClient.Info adInfo = null;
            String adInfoId = "";
            try {
                adInfo = AdvertisingIdClient.getAdvertisingIdInfo(sqlitewraper.context);
                adInfoId = adInfo.getId();
            } catch (IOException | GooglePlayServicesNotAvailableException | GooglePlayServicesRepairableException e) {
                e.printStackTrace();
            }
            return adInfoId;

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
