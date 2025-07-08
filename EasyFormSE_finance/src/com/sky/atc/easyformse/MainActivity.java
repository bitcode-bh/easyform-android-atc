package com.sky.atc.easyformse;

import static com.google.android.gms.common.GooglePlayServicesUtil.isGooglePlayServicesAvailable;
import static com.sky.atc.easyformse.DemoDeviceAdminReceiver.TAG;
import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Point;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.PowerManager;
import android.os.StrictMode;
import android.preference.PreferenceManager;
import android.provider.Settings;
import android.util.Log;
import android.view.Display;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;
import com.google.android.gms.security.ProviderInstaller;
import com.google.ar.core.examples.java.helloar.CameraPermissionHelper;
import com.nareshchocha.databasemanager.Utils.DatabaseManagerSQLite;
import com.scottyab.rootbeer.RootBeer;
import com.sky.atc.easyformse.datautils.CheckAuthOfApplication;
import com.sky.atc.easyformse.datautils.HomeWatcher;
import com.sky.atc.easyformse.datautils.MeatGrinder;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.datautils.RootUtils;
import com.sky.atc.easyformse.download.DownloadUtils;
import com.sky.atc.easyformse.jobshedulers.DeleteBroadcast;
import com.sky.atc.easyformse.jobshedulers.SetAlarmTrip;
import com.sky.atc.easyformse.jobshedulers.SetAlarmWhileIdle;
import com.sky.atc.easyformse.jobshedulers.Util;
import com.sky.atc.easyformse.trip.PowerButtonReceiver;
import com.sky.atc.easyformse.trip.TripMapUtils;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.channels.FileChannel;
import java.util.concurrent.Executor;

import javax.net.ssl.SSLContext;

import io.michaelrocks.paranoid.Obfuscate;

@Obfuscate
public class MainActivity extends Activity {
    static final int ACTIVATION_REQUEST = 47;
    static final int ACTIVATION_REQUEST_code = 101;
    private static final String NOTIFICATION_MSG = "NOTIFICATION MSG";
    ComponentName demoDeviceAdmin;
    NotificationManager mManager = null;
    /* SharedPreferences.Editor editor; */
    MySharedPreferences pref;
    private SQLiteDatabase database;
    SetAlarmTrip setAlarmTrip = new SetAlarmTrip();
    DeleteBroadcast deleteTaskBroadcast = new DeleteBroadcast();
    SetAlarmWhileIdle setAlarmWhileIdle = new SetAlarmWhileIdle();
    public final static int REQUEST_SYSTEM_ALERT_WINDOW = 1010;

    //FOR GEOFENCE
    // Create a Intent send by the notification
    public static Intent makeNotificationIntent(Context context, String msg) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.putExtra(NOTIFICATION_MSG, msg);
        return intent;
    }

    //LOAD NDK LIBRARY
    static {
        System.loadLibrary("native-lib");
    }


    @SuppressLint("ObsoleteSdkInt")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.permission_lay);
        //for chat login
        dynamicChatLogin();

        database = sqlitewraper.getDatabase();
        sqlitewraper.setMainactivity(MainActivity.this);
        if (MeatGrinder.isFoundXposed()) {
            Toast.makeText(getApplicationContext(), "This device is rooted. You can't use this app.", Toast.LENGTH_LONG).show();
            this.finish();
            System.exit(0);
        }
        if (CheckAuthOfApplication.isFridaServer() || CheckAuthOfApplication.checkRunningProcesses(this)) {
            Toast.makeText(getApplicationContext(), "This device is rooted. You can't use this app.", Toast.LENGTH_LONG).show();
            this.finish();
            System.exit(0);
        }
        if (CheckAuthOfApplication.isCheckRoot()) {
            MeatGrinder.isRooted(this);
            if (RootUtils.checkRooted()) {
                showAlertDialogAndExitApp("This device is rooted. You can't use this app.");
            }
            if (CheckAuthOfApplication.isCheckRoot()) {
                executor.execute(() -> {
                    if (DeviceUtils.checkExecuteCommand()) {
                        runOnUiThread(() -> {
                            Toast.makeText(getApplicationContext(), "This device is rooted. You can't use this app.", Toast.LENGTH_LONG).show();
                            // HelloAndroid.this.finish();
                            // System.exit(0);
                        });
                    }
                });
            }
        }


        //CHECK IF APP IS DEBUGGABLE
        if (CheckAuthOfApplication.isCheckDebug()) {
            if (CheckAuthOfApplication.checkDebuggable(this)) {
                finish();
                System.exit(0);
            }
        }
//        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
//        StrictMode.setThreadPolicy(policy);
//        AccessToken accessToken = new AccessToken();
//        String data = accessToken.getAccessToken();
//        Log.e(TAG, "AccessToken is: " + data);


        //CHECK FOR RUNTIME PERMISSION
        if (Build.VERSION.SDK_INT >= 23) {
            checkpermission();
        } else {
            sec_act();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        setIntent(intent);
        processDataFromIntent();

    }

    @SuppressLint("ObsoleteSdkInt")
    private void processDataFromIntent() {
        Intent intent = getIntent();
        if (intent != null) {
            Bundle extras = intent.getExtras();
            if (extras != null) {
                String message = extras.getString("data_key");
                if (getIntent().getBooleanExtra("EXIT", false)) {
                    finish();
                    System.exit(0);
                } else {
                    if (Build.VERSION.SDK_INT >= 23) {
                        checkpermission();
                    } else {

                        sec_act();
                    }
                }
            } else {

                if (Build.VERSION.SDK_INT >= 23) {
                    checkpermission();
                } else {

                    sec_act();
                }

            }
        }
    }


    //FOR EXPORTING DATABASE MANUALLY
    private void exportDB() {
        try {
            File sd = Environment.getExternalStorageDirectory();
            File data = Environment.getDataDirectory();

            if (sd.canWrite()) {
                String currentDBPath = "//data//" + BuildConfig.APPLICATION_ID
                        + "//databases//" + "location.db";
                String backupDBPath = "location_back.db";
                File currentDB = new File(data, currentDBPath);
                File backupDB = new File(sd, backupDBPath);

                FileChannel src = new FileInputStream(currentDB).getChannel();
                FileChannel dst = new FileOutputStream(backupDB).getChannel();
                dst.transferFrom(src, 0, src.size());
                src.close();
                dst.close();
                Toast.makeText(getApplicationContext(), "Backup Successful!",
                        Toast.LENGTH_SHORT).show();

            }
        } catch (Exception e) {
            Toast.makeText(getApplicationContext(), "Backup Failed!",
                    Toast.LENGTH_SHORT).show();

        }
    }

    Executor executor = Runnable::run;


    @SuppressLint("SdCardPath")
    void sec_act() {
        DatabaseManagerSQLite.setSqlDB(sqlitewraper.getDatabase());
        //importDB1(); //To import user database
        if (getIntent().getBooleanExtra("EXIT", false)) {
            finish();
            System.exit(0);
        }
        //check if version is upgraded or not
        //if it is Upgraded version delete sharedpreferences
        checkVersionUpgrade();

        //for application kill event
        killApplication();

        int googlePlayStat = isGooglePlayServicesAvailable(this);
        if (googlePlayStat != ConnectionResult.SUCCESS) {
            Log.w("dss", "Google play status is " + googlePlayStat);
            try {
                GooglePlayServicesUtil.getErrorDialog(googlePlayStat, this, 0)
                        .show();
            } catch (Exception e) {
                //e.printStackTrace()();
            }
        }

        //START THE ACTIVITY recognition SERVICE
        data d = new data();
        String isact_track = d.getFeatureFlag("isact_track");
        // --------------comment for temporary---------------//
        if (isact_track.equalsIgnoreCase("1")) {

            boolean check4 = isMyServiceRunning(context,
                    Activity_recognition.class.getName());
            if (!check4) {
                Intent i = new Intent(context,
                        Activity_recognition.class);
                context.startService(i);
            }
        }


        if (!(Thread.getDefaultUncaughtExceptionHandler() instanceof custom_ex)) {
            Thread.setDefaultUncaughtExceptionHandler(new custom_ex());
        }

        //DEVICE ADMIN OLD(Not used)
        demoDeviceAdmin = new ComponentName(context,
                DemoDeviceAdminReceiver.class);

        database = sqlitewraper.getDatabase();
        Cursor a_t2 = database.rawQuery(
                "select VALUE from APP_states where ITEAM='admin'", null);
        a_t2.moveToFirst();

        String admin = a_t2.getString(0);
        a_t2.close();

        if (CheckAuthOfApplication.isCheckRoot()) {
            if (DeviceUtils.isDeviceRooted() || new RootBeer(context).isRooted() || new RootBeer(context).isRootedWithoutBusyBoxCheck()) {
                showAlertDialogAndExitApp("This device is rooted. You can't use this app.");
            } else {

                //starting the landing ACTIVITY of app
                if (admin.equalsIgnoreCase("0")) {

                    Intent intent = new Intent(context, ph_s.class);
                    intent.setFlags(intent.FLAG_ACTIVITY_NEW_TASK);
                    sqlitewraper.context.startActivity(intent);
                    finish();
                } else {
                    Intent intent = new Intent(context, ph_s.class);
                    intent.setFlags(intent.FLAG_ACTIVITY_NEW_TASK);
                    sqlitewraper.context.startActivity(intent);
                    finish();
                }

            }
        } else {

            //starting the landing ACTIVITY of app
            if (admin.equalsIgnoreCase("0")) {

                Intent intent = new Intent(context, ph_s.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                sqlitewraper.context.startActivity(intent);
                finish();
            } else {
                Intent intent = new Intent(context, ph_s.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                sqlitewraper.context.startActivity(intent);
                finish();
            }

        }


        //start job shedulers for trip to check whether Location services running or not restart if not
        startJobShedulers();
//        startDeviceAdmin();
        //registerBroadcast
        internetBrodcast();
        deleteUploadLog();
        registerBroadcast();

        //Trip Location service restart
        setAlarmTrip.setAlarm(sqlitewraper.context);
        setAlarmWhileIdle.setAlarm(sqlitewraper.context);

        // Delete old task Broadcast
        deleteTaskBroadcast.setDeleteBroadcastAlarm(sqlitewraper.context);


       // startDozeMode(); hide because show multiple time

        //Screen on/off event
        powerbuttonRegister();
        //to change TLS version in Older phone
        installTLS();
        getRealSizeOfDisplay();

        String flagcondition = DownloadUtils.getDeletetaskflag();
        if (flagcondition != null) {
            if (flagcondition.equalsIgnoreCase("1")) {
                //For older database version  Insert delete_old_task table from User_Define_Flow_Master
                DownloadUtils.insertdeleteoldtask();
                DownloadUtils.setDeletetaskflag("0");
            }
        }

    }


    //For importing DATABASE MANUALLY
    private void importDB1() {
        try {
            File sd = Environment.getExternalStorageDirectory();
            File data = Environment.getDataDirectory();
            if (sd.canWrite()) {
                //need to change package name as per user in Database and gradle Here
                //put database in root folder of internal storage with name 'location_back.db'
                String currentDBPath = "//data//" + BuildConfig.APPLICATION_ID
                        + "//databases//" + "location.db";
                String backupDBPath = "location_back.db"; // From SD directory.
                File backupDB = new File(data, currentDBPath);
                File currentDB = new File(sd, backupDBPath);

                FileChannel src = new FileInputStream(currentDB).getChannel();
                FileChannel dst = new FileOutputStream(backupDB).getChannel();
                dst.transferFrom(src, 0, src.size());
                src.close();
                dst.close();

                Toast.makeText(this, "Database import success", Toast.LENGTH_SHORT).show();

            }
        } catch (Exception e) {

            Log.d("##HI", e.getMessage());
        }
    }

    //to check if service is running or not
    private boolean isMyServiceRunning(Context context, String Myservice) {
        ActivityManager manager = (ActivityManager) context
                .getSystemService(Context.ACTIVITY_SERVICE);
        for (RunningServiceInfo service : manager
                .getRunningServices(Integer.MAX_VALUE)) {
            if (Myservice.equals(service.service.getClassName())) {

                return true;
            }
        }
        return false;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {

        if (requestCode == ACTIVATION_REQUEST) {
            if (resultCode == Activity.RESULT_OK) {
                System.out.print("add");
                update_appsate("1", "admin");
                long time = System.currentTimeMillis();

                finish();
                Intent intent = new Intent(context, ph_s.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);

            } else {
                finish();
                Intent intent = new Intent(context,
                        MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);

                System.out.print("fail");
            }
            return;
        }
        if (requestCode == REQUEST_SYSTEM_ALERT_WINDOW) {
            if (checkOverlayDisplayPermission()) {
                sec_act();
            } else {
                requestOverlayDisplayPermission();
            }
        }
        super.onActivityResult(requestCode, resultCode, data);

        // TODO Auto-generated method stub

    }

    void update_appsate(String value, String ITEAM) {
        try {
            String t;
            ContentValues args = new ContentValues();
            t = "ITEAM='" + ITEAM + "'";
            args.put("VALUE", value);
            database.update("APP_states", args, t, null);

        } catch (Exception e) {
            System.out.println(e.getMessage());
            // TODO: handle exception
        }
    }

    //check app permission
    void checkpermission() {

        if (getApplicationContext().getPackageName().equals("com.easyform.muvr") || getApplicationContext().getPackageName().equals("com.easyform.muvr2")) {
            if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_PHONE_STATE)
                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECEIVE_BOOT_COMPLETED)
                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE)
                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WAKE_LOCK)
                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.INTERNET)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_NETWORK_STATE)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.KILL_BACKGROUND_PROCESSES)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_CALENDAR)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WRITE_CALENDAR)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_BACKGROUND_LOCATION)

                    != PackageManager.PERMISSION_GRANTED) {

                if (ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_PHONE_STATE) &&
                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.RECEIVE_BOOT_COMPLETED) &&
                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE) &&
                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE) &&
                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WAKE_LOCK) &&
                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.INTERNET)
//                       ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.CAMERA) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_NETWORK_STATE) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.KILL_BACKGROUND_PROCESSES) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_CALENDAR) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WRITE_CALENDAR) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.RECORD_AUDIO) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_BACKGROUND_LOCATION)

                ) {

                    sec_act();

                } else {


                    ActivityCompat.requestPermissions(MainActivity.this,
                            new String[]{Manifest.permission.READ_PHONE_STATE,
                                    Manifest.permission.RECEIVE_BOOT_COMPLETED,
                                    Manifest.permission.WRITE_EXTERNAL_STORAGE,
                                    Manifest.permission.READ_EXTERNAL_STORAGE,
                                    Manifest.permission.WAKE_LOCK,
                                    Manifest.permission.INTERNET,
//                                    Manifest.permission.CAMERA,
//                                    Manifest.permission.ACCESS_NETWORK_STATE,
//                                    Manifest.permission.ACCESS_COARSE_LOCATION,
//                                    Manifest.permission.KILL_BACKGROUND_PROCESSES,
//                                    Manifest.permission.ACCESS_FINE_LOCATION,
//                                    Manifest.permission.WRITE_CALENDAR,
//                                    Manifest.permission.READ_CALENDAR,
//                                    Manifest.permission.RECORD_AUDIO,
//                                    Manifest.permission.ACCESS_BACKGROUND_LOCATION

                            },
                            ACTIVATION_REQUEST_code);

                }
            } else {
                sec_act();
            }
        } else {

            String AllPermission = sqlitewraper.context.getResources().getString(R.string.AllPermission);

            if (AllPermission.equalsIgnoreCase("true")) {

//           if allpermission is true ask all permission apk install time 05/12/2024
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECEIVE_BOOT_COMPLETED)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WAKE_LOCK)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.INTERNET)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_NETWORK_STATE)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.KILL_BACKGROUND_PROCESSES)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACTIVITY_RECOGNITION)
//                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_PHONE_STATE)
//                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_CALENDAR)
//                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WRITE_CALENDAR)
//                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_CONTACTS)
//                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CALL_PHONE)

                        != PackageManager.PERMISSION_GRANTED) {


                    if (ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.RECEIVE_BOOT_COMPLETED) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WAKE_LOCK) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.INTERNET) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_NETWORK_STATE) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.CAMERA) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.RECORD_AUDIO) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.KILL_BACKGROUND_PROCESSES) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACTIVITY_RECOGNITION) &&
                    ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) &&
                    ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS)
//                    ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_PHONE_STATE) &&
//                    ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.CALL_PHONE) &&
//                    ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WRITE_CALENDAR) &&
//                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_CALENDAR) &&
//                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_CONTACTS)



                    ) {
                        sec_act();

                    } else {


                        ActivityCompat.requestPermissions(MainActivity.this,
                                new String[]{
                                        Manifest.permission.RECEIVE_BOOT_COMPLETED,
                                        Manifest.permission.WAKE_LOCK,
                                        Manifest.permission.INTERNET,
                                        Manifest.permission.ACCESS_NETWORK_STATE,
                                        Manifest.permission.ACCESS_COARSE_LOCATION,
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.READ_EXTERNAL_STORAGE,
                                        Manifest.permission.WRITE_EXTERNAL_STORAGE,
                                        Manifest.permission.CAMERA,
                                        Manifest.permission.RECORD_AUDIO,
                                        Manifest.permission.KILL_BACKGROUND_PROCESSES,
                                        Manifest.permission.ACCESS_BACKGROUND_LOCATION,
                                        Manifest.permission.ACTIVITY_RECOGNITION,
                                        Manifest.permission.POST_NOTIFICATIONS
//                                        Manifest.permission.READ_PHONE_STATE,
//                                        Manifest.permission.WRITE_CALENDAR,
//                                        Manifest.permission.READ_CALENDAR,
//                                        Manifest.permission.READ_CONTACTS,
//                                        Manifest.permission.CALL_PHONE,
                                },
                                ACTIVATION_REQUEST_code);

                    }
                } else {
                    sec_act();
                }
            }
            else {
                // all permission is false only ask location permission apk install time
//            remove other permission in main activity only use time ask permission 22-04-2024
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECEIVE_BOOT_COMPLETED)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WAKE_LOCK)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.INTERNET)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_NETWORK_STATE)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION)
                        + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACTIVITY_RECOGNITION)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_PHONE_STATE)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.KILL_BACKGROUND_PROCESSES)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_CALENDAR)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.WRITE_CALENDAR)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.READ_CONTACTS)
//                    + ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CALL_PHONE)

                        != PackageManager.PERMISSION_GRANTED) {

                    if (ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.RECEIVE_BOOT_COMPLETED) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WAKE_LOCK) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.INTERNET) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_NETWORK_STATE) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS)
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.ACTIVITY_RECOGNITION) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WRITE_EXTERNAL_STORAGE) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_EXTERNAL_STORAGE) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.CAMERA) &&
//                       ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_PHONE_STATE) &&
//                       ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.RECORD_AUDIO) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.KILL_BACKGROUND_PROCESSES) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.WRITE_CALENDAR) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_CALENDAR) &&

//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.READ_CONTACTS) &&
//                        ActivityCompat.shouldShowRequestPermissionRationale(MainActivity.this, Manifest.permission.CALL_PHONE)&&

                    ) {

                        sec_act();

                    } else {


                        ActivityCompat.requestPermissions(MainActivity.this,
                                new String[]{
                                        Manifest.permission.RECEIVE_BOOT_COMPLETED,
                                        Manifest.permission.WAKE_LOCK,
                                        Manifest.permission.INTERNET,
                                        Manifest.permission.ACCESS_NETWORK_STATE,
                                        Manifest.permission.ACCESS_COARSE_LOCATION,
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.POST_NOTIFICATIONS
//                                    Manifest.permission.READ_EXTERNAL_STORAGE,
//                                    Manifest.permission.WRITE_EXTERNAL_STORAGE,
//                                    Manifest.permission.CAMERA,
//                                    Manifest.permission.READ_PHONE_STATE,
//                                    Manifest.permission.ACTIVITY_RECOGNITION,
//                                    Manifest.permission.RECORD_AUDIO,
//                                    Manifest.permission.KILL_BACKGROUND_PROCESSES,
//                                    Manifest.permission.WRITE_CALENDAR,
//                                    Manifest.permission.READ_CALENDAR,
//                                    Manifest.permission.READ_CONTACTS,
//                                    Manifest.permission.CALL_PHONE,
                                },
                                ACTIVATION_REQUEST_code);

                    }
                } else {
                    sec_act();
                }
            }


        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String[] permissions, int[] grantResults) {
        if (requestCode == ACTIVATION_REQUEST_code) {// If request is cancelled, the result arrays are empty.
            if (getApplicationContext().getPackageName().equals("com.easyform.muvr") || getApplicationContext().getPackageName().equals("com.easyform.muvr2")) {
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED
                        && grantResults[1] == PackageManager.PERMISSION_GRANTED
                        && grantResults[2] == PackageManager.PERMISSION_GRANTED
                        && grantResults[3] == PackageManager.PERMISSION_GRANTED
                        && grantResults[4] == PackageManager.PERMISSION_GRANTED
                        && grantResults[5] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[6] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[7] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[8] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[9] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[10] == PackageManager.PERMISSION_GRANTED
                ) {

                    sec_act();

                } else {

                    showAlertDialogPermission("You need to allow access before using application.");

                    // permission denied, boo! Disable the
                    // functionality that depends on this permission.
                }

            } else {

                String AllPermission = sqlitewraper.context.getResources().getString(R.string.AllPermission);

                if (AllPermission.equalsIgnoreCase("true")) {
                    if (grantResults.length > 0
                            && grantResults[0] == PackageManager.PERMISSION_GRANTED
                            && grantResults[1] == PackageManager.PERMISSION_GRANTED
                            && grantResults[2] == PackageManager.PERMISSION_GRANTED
                            && grantResults[3] == PackageManager.PERMISSION_GRANTED
                            && grantResults[4] == PackageManager.PERMISSION_GRANTED
                            && grantResults[5] == PackageManager.PERMISSION_GRANTED
                            && grantResults[6] == PackageManager.PERMISSION_GRANTED
                            && grantResults[7] == PackageManager.PERMISSION_GRANTED
                            && grantResults[8] == PackageManager.PERMISSION_GRANTED
                            && grantResults[9] == PackageManager.PERMISSION_GRANTED
                            && grantResults[10] == PackageManager.PERMISSION_GRANTED
//                            && grantResults[11] == PackageManager.PERMISSION_GRANTED
//                            && grantResults[12] == PackageManager.PERMISSION_GRANTED
//                            && grantResults[13] == PackageManager.PERMISSION_GRANTED
//                            && grantResults[14] == PackageManager.PERMISSION_GRANTED
//                            && grantResults[15] == PackageManager.PERMISSION_GRANTED
                    ) {

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
//                      int activitypemission = ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACTIVITY_RECOGNITION);
//
//                       boolean isAppActivityPermissionGranted =(activitypemission == PackageManager.PERMISSION_GRANTED);
//
//
//
//
//                       if(!isAppActivityPermissionGranted)
//                       {
//                           showAlertDialogPermission("This app requires physical activity permission");
//                           return;
//                       }

                            // screen over other apps permission
                            if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
                                if (checkOverlayDisplayPermission()) {
                                    sec_act();
                                } else {
                                    requestOverlayDisplayPermission();
                                }
                            } else {
                                sec_act();
                            }

                        } else {
                            if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
                                if (checkOverlayDisplayPermission()) {
                                    sec_act();
                                } else {
                                    requestOverlayDisplayPermission();
                                }
                            } else {
                                sec_act();
                            }
                            //  sec_act();
                        }
                    } else {

                        showAlertDialogPermission("You need to allow access before using application.");

                        // permission denied, boo! Disable the
                        // functionality that depends on this permission.
                    }
                } else {
                    if (grantResults.length > 0
                            && grantResults[0] == PackageManager.PERMISSION_GRANTED
                            && grantResults[1] == PackageManager.PERMISSION_GRANTED
                            && grantResults[2] == PackageManager.PERMISSION_GRANTED
                            && grantResults[3] == PackageManager.PERMISSION_GRANTED
                            && grantResults[4] == PackageManager.PERMISSION_GRANTED
                            && grantResults[5] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[6] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[7] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[8] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[9] == PackageManager.PERMISSION_GRANTED
                        //&& grantResults[10] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[10] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[11] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[12] == PackageManager.PERMISSION_GRANTED
//                       && grantResults[13] == PackageManager.PERMISSION_GRANTED
                        //&& grantResults[14] == PackageManager.PERMISSION_GRANTED
                        // && grantResults[15] == PackageManager.PERMISSION_GRANTED
                    ) {

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
//                      int activitypemission = ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACTIVITY_RECOGNITION);
//
//                       boolean isAppActivityPermissionGranted =(activitypemission == PackageManager.PERMISSION_GRANTED);
//
//
//
//
//                       if(!isAppActivityPermissionGranted)
//                       {
//                           showAlertDialogPermission("This app requires physical activity permission");
//                           return;
//                       }

                            // screen over other apps permission
                            if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
                                if (checkOverlayDisplayPermission()) {
                                    sec_act();
                                } else {
                                    requestOverlayDisplayPermission();
                                }
                            } else {
                                sec_act();
                            }

                        } else {
                            if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
                                if (checkOverlayDisplayPermission()) {
                                    sec_act();
                                } else {
                                    requestOverlayDisplayPermission();
                                }
                            } else {
                                sec_act();
                            }
                            //  sec_act();
                        }
                    } else {

                        showAlertDialogPermission("You need to allow access before using application.");

                        // permission denied, boo! Disable the
                        // functionality that depends on this permission.
                    }
                }


            }

            // other 'case' lines to check for other
            // permissions this app might request
        }
    }

    public void requestOverlayDisplayPermission() {
        AlertDialog dialog;
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setCancelable(false);
        builder.setTitle("Screen Overlay Permission Needed");
        builder.setMessage("This app requires 'Display over other apps' permission from System Settings.");
        builder.setPositiveButton("Allow in Settings", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, REQUEST_SYSTEM_ALERT_WINDOW);
                //  finish();
            }
        });
        dialog = builder.create();
        dialog.show();
    }

    public boolean checkOverlayDisplayPermission() {
        // Android Version is lesser than Marshmallow or
        // the API is lesser than 23
        // doesn't need 'Display over other apps' permission enabling.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.M) {
            // If 'Display over other apps' is not enabled
            // it will return false or else true
            if (!Settings.canDrawOverlays(MainActivity.this)) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    public void showAlertDialogAndExitApp(String message) {

        AlertDialog alertDialog = new AlertDialog.Builder(this).create();
        alertDialog.setTitle("Alert");
        alertDialog.setMessage(message);
        alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
                (dialog, which) -> {
                    dialog.dismiss();
                    finish();
                });

        alertDialog.show();
    }

    public void showAlertDialogPermission(String message) {

        AlertDialog alertDialog = new AlertDialog.Builder(this).create();
        alertDialog.setTitle("Missing Permission!");
        alertDialog.setCancelable(false);
        alertDialog.setMessage(message);
        alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
                (dialog, which) -> {
                    dialog.dismiss();
                    checkpermission();
                });

        alertDialog.show();
    }

    @Override
    protected void onDestroy() {
        Log.d("####MainActivity", "ondestroy1");
        pref = sqlitewraper.getSecureShared("MyPref");
        pref.putString("KILL", String.valueOf(System.currentTimeMillis())); // Saving string
        pref.commit();
        Log.d("###MainActivity", "ondestroy2");
        super.onDestroy();
    }

    //
    private void killApplication() {

        try {
            pref = sqlitewraper.getSecureShared("MyPref");
            String appstop = pref.getString("KILL", null);

            if (appstop != null) {

                Cursor a_t = database.rawQuery(
                        "select Value from APP_states where ITEAM ='nick'",
                        null);
                a_t.moveToFirst();

                String username = null;
                if (a_t.getCount() > 0) {
                    username = a_t.getString(0);
                }
                a_t.close();
                if (!username.equalsIgnoreCase("0")) {

                    if (!appstop.equalsIgnoreCase("0")) {


                        long appstart = System.currentTimeMillis();
                        long appduration = appstart - Long.valueOf(appstop);

                        boolean isInserted = DeviceEventsUtils.insertIntoEvents(appstop, String.valueOf(appstart), String.valueOf(appduration), "App_outage");
                        if (isInserted) {
                            pref = sqlitewraper.getSecureShared("MyPref");
                            pref.putString("KILL", "0"); // Saving string
                            pref.commit();
                        }
                    }
                }
            }
        } catch (Exception e) {

        }
    }

    @SuppressLint("ObsoleteSdkInt")
    private void startJobShedulers() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Util.scheduleJob(this);
        }
        Util.scheduleJobFirebase(this);

    }

    private void checkVersionUpgrade() {

        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        int versionCode = sharedPreferences.getInt("VERSION_CODE", 0);

        if (versionCode != BuildConfig.VERSION_CODE) {
            deleteAllSharedprefences();
            pref = sqlitewraper.getSecureShared("UPDATEPREF");
            pref.putString("UPDATEMILLI", String.valueOf(System.currentTimeMillis())); // Saving string
            pref.commit();
            Log.d("##newmainActivity", "");
        }

        sharedPreferences.edit().putInt("VERSION_CODE", BuildConfig.VERSION_CODE).apply();
    }

    private void internetBrodcast() {

        try {
            IntentFilter intentFilter = new IntentFilter("android.net.conn.CONNECTIVITY_CHANGE");
            this.registerReceiver(new UpdateReceiver(), intentFilter);
            this.registerReceiver(new gprs(), intentFilter);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void deleteUploadLog() {
        LogUtils.deleteLogFile();
    }

    private void registerBroadcast() {
        IntentFilter intentFilter = new IntentFilter("android.location.PROVIDERS_CHANGED");
        IntentFilter intentFilter1 = new IntentFilter("android.intent.action.BOOT_COMPLETED");
        //activity_recognize receiver
        IntentFilter intentFilter2 = new IntentFilter("result");
        //Screen on off
        IntentFilter intentFilter3 = new IntentFilter("android.intent.action.USER_PRESENT");
        //Phone switch off
        IntentFilter intentFilter4 = new IntentFilter("android.intent.action.ACTION_SHUTDOWN");

        this.registerReceiver(new gpsreciever(), intentFilter);
        this.registerReceiver(new phoneon(), intentFilter1);
        this.registerReceiver(new BootReceiver(), intentFilter1);
        this.registerReceiver(new activity_recognize(), intentFilter2);
        this.registerReceiver(new onreboot(), intentFilter3);
        this.registerReceiver(new ShutdownReceiver(), intentFilter4);

        ComponentName receiver = new ComponentName(this, onreboot.class);
        PackageManager pm = this.getPackageManager();

        pm.setComponentEnabledSetting(receiver,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP);
    }

    @SuppressLint("ObsoleteSdkInt")
    private void startDozeMode() {

        Intent intent = new Intent();
        String packageName = context.getPackageName();
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (pm.isIgnoringBatteryOptimizations(packageName)) {
                intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + packageName));
                startActivity(intent);
            }
        }
    }

    private void deleteAllSharedprefences() {

        @SuppressLint("SdCardPath") File sharedPreferenceFile = new File("/data/data/" + getPackageName() + "/shared_prefs/");
        if (sharedPreferenceFile != null && sharedPreferenceFile.listFiles() != null) {
            File[] listFiles = sharedPreferenceFile.listFiles();
            for (File file : listFiles) {
                file.delete();
            }
        }
    }

    private void powerbuttonRegister() {

        IntentFilter filter = new IntentFilter(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        PowerButtonReceiver mReceiver = new PowerButtonReceiver();
        registerReceiver(mReceiver, filter);
    }

    @SuppressLint("ObsoleteSdkInt")
    private void installTLS() {

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            try {
                SSLContext.getInstance("TLSv1.2");
                ProviderInstaller.installIfNeeded(this);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


    private void dynamicChatLogin() {

        // Get extra data included in the Intent
        BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {

                try {
                    pref = sqlitewraper.getSecureShared("MyPref");
                    String isChatLogin = pref.getString("ISLOGGEDIN", "false");

                    if (isChatLogin.equalsIgnoreCase("false")) {

//                    String users = args.getJSONObject(0).getString("users");
                        MySharedPreferences sharedPreferences = sqlitewraper.getSecureShared("pre1");
                        String chatResponse = sharedPreferences.getString("Chat_Response", "");
                        String randomPassword = sharedPreferences.getString("Random_Password", "");
                        String occupantsID = sharedPreferences.getString("Occupants_id", "");

                        if (!chatResponse.equalsIgnoreCase("")) {

                            pref = sqlitewraper.getSecureShared("MyPref");
                            pref.putString("ISLOGGEDIN", "true"); // Saving string
                            pref.commit();

                            Intent ii = new Intent("com.easyform.chat");
                            ii.putExtra("Chat_Response", chatResponse);
                            ii.putExtra("Random_Password", randomPassword);
//                          ii.putExtra("Occupants_id", users);
                            startActivityForResult(ii, 188);

                        }
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        };
        LocalBroadcastManager.getInstance(context).registerReceiver(mMessageReceiver,
                new IntentFilter("dynamic-login-chat"));
    }

    private void getRealSizeOfDisplay() {

        Display display = getWindowManager().getDefaultDisplay();
        Point size = new Point();
        display.getRealSize(size);
        final int height = size.y;
        final int width = size.x;
        Intent i = null;
        try {
            i = new Intent(this, Class.forName("com.example.easyformzoom.broadcast_receiver.Zoom_Broadcast"));
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        if (i != null) {
            i.setAction("com.example.easyformzoom.DisplayRemoteUtils");
            i.putExtra("height", height);
            i.putExtra("width", width);
            sendBroadcast(i);
           /* RemoteUtils.setRealSizeHeight(height);
        RemoteUtils.setRealSizeWidth(width);*/
        }
        Intent i1 = null;
        try {
            i1 = new Intent(this, Class.forName("com.easyform.jitsi.broadcasts.JitsiPluginBroadcast"));
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        if (i1 != null) {
            i1.setAction("com.easyform.jitsi.size");
            i1.putExtra("height", height);
            i1.putExtra("width", width);
            sendBroadcast(i1);
        }

        pref = sqlitewraper.getSecureShared("SCREEN_SIZE");
        pref.putString("MY_HEIGHT", String.valueOf(height)); // Saving string
        pref.putString("MY_WIDTH", String.valueOf(width)); // Saving string
        pref.commit();
    }

    @Override
    protected void onResume() {
        super.onResume();
    }
}