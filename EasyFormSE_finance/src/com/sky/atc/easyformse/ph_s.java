package com.sky.atc.easyformse;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.ActivityManager.RunningServiceInfo;
import android.app.AlarmManager;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.PictureInPictureParams;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.IntentSender;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.Configuration;
import android.database.Cursor;
import android.location.LocationManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.util.DisplayMetrics;
import android.util.Log;
import android.util.Rational;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Result;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsStatusCodes;
import com.judemanutd.autostarter.AutoStartPermissionHelper;
import com.sky.atc.easyformse.attendance.AttendanceClass;
import com.sky.atc.easyformse.attendance.CheckSheetJsonConstant;
import com.sky.atc.easyformse.attendance.newattendanceutils.AttendanceUtil;
import com.sky.atc.easyformse.attendance.newattendanceutils.NotificationUtil;
import com.sky.atc.easyformse.datautils.HomeWatcher;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.datautils.OnHomePressedListener;
import com.sky.atc.easyformse.location.FakeLocationUtils;
import com.sky.atc.easyformse.trip.FloatingBubbleService;
import com.sky.atc.easyformse.trip.LocationOutageUtils;
import com.sky.atc.easyformse.trip.ServiceOutage;
import com.sky.atc.easyformse.trip.TripBackgroundMapActivity;
import com.sky.atc.easyformse.trip.TripMapUtils;
import com.sky.atc.easyformse.utils.LogUtils;

import net.sqlcipher.database.SQLiteDatabase;

import org.apache.cordova.CordovaActivity;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static com.sky.atc.easyformse.sqlitewraper.context;
import static com.sky.atc.easyformse.sqlitewraper.mainactivity;


@StringFogIgnore
public class ph_s extends CordovaActivity implements GoogleApiClient.OnConnectionFailedListener, GoogleApiClient.ConnectionCallbacks, ResultCallback {

    protected GoogleApiClient mGoogleApiClient;
    protected LocationRequest locationRequest;
    //    SharedPreferences.Editor editor;
    MySharedPreferences pref;
    String login_key = "NA";
    int REQUEST_CHECK_SETTINGS = 100;
    SQLiteDatabase database;
    int gpsflag = 0;
    boolean permit;
    boolean isDialogShowing = false;
    private CountDownTimer timer;
    private static final long TIMER_DURATION = 1 * 60 * 1000; // 2 minutes in milliseconds

    String checkpermissionfirstattempt ;
    String ShowDialog = "false";
    boolean isbackgroundDialogShowing = false;
    boolean isnotificationDialog = false;
    boolean isoverlyaDialog = false;
    boolean ShowGPSAlert = false;
    boolean alltimelocation = false;
    boolean isShowNotiDialog = false;
    public static ph_s instance;

    //brodcast for gps on/off
    private final BroadcastReceiver mReceivedSMSReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();

            if (action.equals("android.location.PROVIDERS_CHANGED")) {
                //your SMS processing code
                LocationManager lm =  (LocationManager) sqlitewraper.context.getSystemService(LOCATION_SERVICE);;
                boolean isGPSEnabled = lm
                        .isProviderEnabled(LocationManager.GPS_PROVIDER);
                String f_gps;
                if (isGPSEnabled) {
//                    displayAlert("Please Start Gps in High Accuracy mode Throughout Application", 0);
//                    displayAlert("Please check,GPS must be on in high accuracy mode in GPS setting.", 0);
                } else {
                    database = sqlitewraper.getDatabase();
                    String checkgpsstate = checkgps();

                    if (!checkgpsstate.equalsIgnoreCase("0")) {

//                        displayAlert("Please check,GPS must be on in high accuracy mode in GPS setting.", 0);
                        ShowGPSAlert = false;
                        gpsonoff();

                    }
                }
            }

            //Will invoke from login_plug
            if (action.equals("com.easyform.CUSTOM_BROADCAST")) {
                //your SMS processing code
                LocationManager lm = (LocationManager) sqlitewraper.context
                        .getSystemService(sqlitewraper.context.LOCATION_SERVICE);
                boolean isGPSEnabled = lm
                        .isProviderEnabled(LocationManager.GPS_PROVIDER);

                if (!isGPSEnabled) {
                    database = sqlitewraper.getDatabase();
//                    String checkgpsstate = checkgps();
                    if (!isGPSEnabled) {
                        gpsonoff();
                    }
                }
            }
        }
    };


    @Override
    public void onCreate(Bundle savedInstanceState) {
        LogUtils.writeRfTrackLogToFile("Celled onCreate ", this.getClass().getName());
        super.onCreate(savedInstanceState);
        instance = this;
        sqlitewraper.checkIsFakeLocation(getApplicationContext());
//      getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE); //to disable screenshot of activity
        database = sqlitewraper.getDatabase();


        //Will invoke from location service
        LocalBroadcastManager.getInstance(this).registerReceiver(mMessageReceiver,
                new IntentFilter("fake-location"));

        //    //home button press logic for trip background map
        if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
            homeButtonClicked();
        }
        //One Time login to by login screen
        MySharedPreferences prefs = sqlitewraper.getSecureShared("pre1");
        login_key = prefs.getString("login_key", "False");

        //Check if trip has outage>60% of total trip time than return true
//        permit = ServiceOutageCheck.startDeviceAdmin();

        //SHOW DIALOG FOR BACKGROUND POWER SETTING BASED ON MODEL
//        if (permit) {
//            showAlertDialogAutostartalldevices();
//        }
//              logwrite tag set value false
                    SharedPreferences sharedPreferences= sqlitewraper.context.getSharedPreferences("LogWrite",0);
                    SharedPreferences.Editor mEditor = sharedPreferences.edit();
                    mEditor.putBoolean("isLogWrite",false);  // saving string
                    mEditor.apply();



        String checkfirstattempt_vivo = null;
        pref = sqlitewraper.getSecureShared("FIRSTTIMEVIVO");
        checkfirstattempt_vivo = pref.getString("FIRSTTIMEVIVO", "0");
        if(!checkfirstattempt_vivo.equalsIgnoreCase("1")) {
             if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
                OpenSetting_vivodevice();
            }

        }
        else {
            // when event insert Service_outage vivo device open battery optimization setting dialog box
            pref = sqlitewraper.getSecureShared("MyPref");
            String SERVICEInsert = pref.getString("SERVICEInsert", "0");
            if(SERVICEInsert.equalsIgnoreCase("1"))
            {
                OpenSetting_vivodevice();
                pref.putString("SERVICEInsert","0");
                pref.commit();
            }

        }
        String checkfirstattempt = null;
        try {
            pref = sqlitewraper.getSecureShared("FIRSTTIME");
            checkfirstattempt = pref.getString("FIRSTTIME", "0");
        } catch (Exception e) {
            e.printStackTrace();
        }

        // code move when trip start only 17092025
//        if (!checkfirstattempt.equalsIgnoreCase("1")) {
//
//            //to ignore battery optimizATION In Background
//            if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true"))
//            {
//                activateDozemode();
//            }
//            //SHOW DIALOG FOR BACKGROUND POWER SETTING BASED ON MODEL
//            showAlertDialogAutostartalldevices();
//
//        } else {
//
//            //Check if trip has outage is more than 15 minutes of total trip time than
//            //SHOW DIALOG FOR BACKGROUND POWER SETTING BASED ON MODEL
//
//            String serviceoutage = ServiceOutage.getserviceoutage().get(0);
//            String tid = ServiceOutage.getserviceoutage().get(1);
//
//            if (serviceoutage != null && tid != null) {
//                if (!serviceoutage.equals("0") && !tid.equals("0")) {
//                    if (Float.parseFloat(serviceoutage) > 900000) {
//                        showAlertDialogAutostartalldevices();
//                    }
//                    String t4;
//                    t4 = "tid =" + tid;
//                    ContentValues cv4 = new ContentValues();
//                    cv4.put("serviceoutage_flag", "1");
//                    long temp4 = database.update("lat_plug", cv4, t4, null);
//                }
//            }
//        }

        //If fake location detected one have to off/on gps or phone
        fakeLocationCheck();

        //For Showing Upload pending Notification
        Intent p2 = new Intent(sqlitewraper.context, foreverservice.class);
        sqlitewraper.context.startService(p2);


        //To Redirect to the screen according to flag
        if (login_key.equals("True")) {
            super.loadUrl("file:///android_asset/www2/download_status.html");
        }
        if (login_key.equals("False")) {
            super.loadUrl("file:///android_asset/www2/Login.html");
//            super.loadUrl("file:///android_asset/www2_muvr/index.html");
        }

        //register brodcast for gps on/off call onresume method so comment Oncreate method
//        IntentFilter filter = new IntentFilter("android.location.PROVIDERS_CHANGED");
//        this.registerReceiver(mReceivedSMSReceiver, filter);
//        IntentFilter filter1 = new IntentFilter("com.easyform.CUSTOM_BROADCAST");
//        this.registerReceiver(mReceivedSMSReceiver, filter1);

//        app show in minimize when rf track app is available on device as per discuss with sir we commit this code 01-05-2024
//        if (isAppInstalled("com.easyform.rftrack")) {
//            pictureInPictureHomeClicked(true);
//        } else {
//            LogUtils.writeRfTrackLogToFile("RfTrack is not installed", "onCreate " + ph_s.this.getClass().getName());
//        }
    }

    private boolean isAppInstalled(String packageName) {
        PackageManager pm = getPackageManager();
        try {
            pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
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

    }

    @Override
    public void onDestroy() {
        LogUtils.writeRfTrackLogToFile("Celled onDestroy ", this.getClass().getName());
        super.onDestroy();
        if (mGoogleApiClient != null) {
            if (mGoogleApiClient.isConnected()) {
                mGoogleApiClient.disconnect();
            }
        }
        LocalBroadcastManager.getInstance(this).unregisterReceiver(mMessageReceiver);

    }

    @Override
    protected void onStop() {
        LogUtils.writeRfTrackLogToFile("Celled onStop ", this.getClass().getName());
        super.onStop();
    }

    @Override
    protected void onPause() {
        LogUtils.writeRfTrackLogToFile("Celled onPause ", this.getClass().getName());
        super.onPause();

        B_new.setIsInBackgeound(true);

        this.unregisterReceiver(mReceivedSMSReceiver);

        //for new trip
        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();

        if (tripflagCount == 0) {

            Cursor a_t12 = database.rawQuery(
                    "select value from APP_states where ITEAM ='gps'", null);
            a_t12.moveToFirst();
            int j1 = a_t12.getCount();

            String gps = null;
            if (a_t12.getCount() > 0) {

                gps = a_t12.getString(0);

                //gps=2 App tracking
                //gps=1 continues tracking
                //gps=0 No tracking

                if (gps.equalsIgnoreCase("2")) {

                    boolean check123 = isMyServiceRunning(sqlitewraper.context,
                            newfused.class.getName());
                    if (check123) {
                        Intent i = new Intent(sqlitewraper.context, newfused.class);
                        stopService(i);
                    }

//                    hide newfused and activity_recognition code  23-07-2025

//                    boolean check = isMyServiceRunning(sqlitewraper.context,
//                            newfused_gps.class.getName());
//                    if (check) {
//                        Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
//                        stopService(i);
//                    }
//                    boolean checkActivity_recognition = isMyServiceRunning(sqlitewraper.context,
//                            Activity_recognition.class.getName());
//                    if (checkActivity_recognition) {
//                        Intent i = new Intent(sqlitewraper.context, Activity_recognition.class);
//                        stopService(i);
//                    }

                    pref = sqlitewraper.getSecureShared("MyPref");
                    pref.putBoolean("isuploadlastentry", false); // Saving string
                    pref.commit();
                }
            }
            a_t12.close();
        }
    }

    public void fakeLocationCheck() {

        Log.d("##MainActivityFake", String.valueOf(sqlitewraper.getFakeflag()));
        try {
//            if (sqlitewraper.getFakeflag() == 0) {

            MySharedPreferences prefs = sqlitewraper.getSecureShared("MY_PREFS_NAME");
            int bootflag = prefs.getInt("bootflag", 0); //0 is the default value.

            if (bootflag == 1) {
                if (!TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true")) {
                    if (sqlitewraper.isMockAvailable) {
                        displayAlert(getString(R.string.restartyourphone), 1);
                        LocationManager lm = (LocationManager) sqlitewraper.context
                                .getSystemService(sqlitewraper.context.LOCATION_SERVICE);
                        boolean isGPSEnabled = lm
                                .isProviderEnabled(LocationManager.GPS_PROVIDER);
                        if (!isGPSEnabled) {
                            gpsonoff();
                        }
                    }
                }
            }
//            }

        } catch (Exception e) {
            Log.d("##MainActivity", String.valueOf(sqlitewraper.getFakeflag()));
        }
    }

    String fakeLocationFlag = sqlitewraper.context.getResources().getString(R.string.MOCKLOCATION);
    public static boolean startmap = false;

    @Override
    protected void onStart() {
        IntentFilter filter = new IntentFilter("android.location.PROVIDERS_CHANGED");
        registerReceiver(new gpsreciever(), filter);
        LogUtils.writeRfTrackLogToFile("Celled onStart ", this.getClass().getName());
        super.onStart();
    }

    @Override
    protected void onRestart() {
        LogUtils.writeRfTrackLogToFile("Celled onRestart ", this.getClass().getName());
        super.onRestart();
    }

    @Override
    protected void onResume() {
        LogUtils.writeRfTrackLogToFile("Celled onResume ", this.getClass().getName());
        super.onResume();


//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
//        {
//            boolean isEnabled = isNotificationServiceEnabled(this);
//            if (isEnabled)
//            {
//                Intent mServiceIntent = new Intent(this, NotificationListener.class);
//                startService(mServiceIntent);
//                //service is enabled do something
//            } else {
//                //service is not enabled try to enabled by calling...
//
//                if (checkOverlayDisplayPermission()) {
//                    requestNotificationaccess();
//                } else {
//                    requestOverlayDisplayPermission();
//                }
//            }
//        }

        try{
            String Attendance = pref.getString("Attendance","false");
            if(Attendance.equalsIgnoreCase("false") || Attendance.equalsIgnoreCase("null"))
            {
            }
            else {
                if( AttendanceUtil.getAttendanceDataList() != null) {


                    new Handler(Looper.getMainLooper()).postDelayed(() -> {

                        MySharedPreferences mySharedPreferences = sqlitewraper.getSecureShared("AttendanceData");
                        String attendanceJson = mySharedPreferences.getString("attendanceJson", "");
                        boolean isRoleMatched = DeviceEventsUtils.CheckRoleIdForAttendance(attendanceJson);

                        if(isRoleMatched) {
                            // AttendanceUtil.setAttendanceDataListAndSave(finalAttendanceValues);
                            Log.e("attendanceDataList : ", AttendanceUtil.getAttendanceDataList().toString());
                            AttendanceUtil.setAttendanceNotificationAlarm(AttendanceUtil.getAttendanceDataList().get(0));
                        }
                        else {
                            sqlitewraper.getSecureShared("AttendanceData").clear();
                        }

                    }, 1000);


                }
            }
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }

        String AllPermission = sqlitewraper.context.getResources().getString(R.string.AllPermission);
        if(AllPermission.equalsIgnoreCase("true")) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Locationpermissioncheck();
            }
        }
        pref = sqlitewraper.getSecureShared("MyPref");
        String attendance_module  = pref.getString("attendance_module","false");

        if(attendance_module.equalsIgnoreCase("true")) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                notificationpermissioncheck();
            }
        }
        //check device time auto or manual and stop user if it is manual
        String checkDeviceTime = context.getResources().getString(R.string.RestrictDeviceTime);
        if(checkDeviceTime.equalsIgnoreCase("true"))
        {
            checkDeviceTime();
        }

        //when trip is running and app minimize at time trip map is not open
        // when xiaomi device show dialog box allow background permission
        String checkfirstattemptXiaomi = null;
        try {
            pref = sqlitewraper.getSecureShared("Firsttime_Xiaomi");
            checkfirstattemptXiaomi = pref.getString("Firsttime_Xiaomi", "0");
        } catch (Exception e) {
            e.printStackTrace();
        }

        if(!checkfirstattemptXiaomi.equalsIgnoreCase("1")) {
            if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
                CheckPermissionXioami();

                // trip map open cancle notification
                if (checkpermissionfirstattempt.equalsIgnoreCase("1")) {
                    NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                    notificationManager.cancel(12);
                }
            }
        }

       // check if there is finish activity enabled in developer options
        DeviceEventsUtils.isFinishActivitiesOptionEnabled(sqlitewraper.context);

        // for Show showAttendanceAlertDialog to User
        /*if (!DeviceEventsUtils.getLoginDetails().get(0).equalsIgnoreCase("0")) {
            showAttendanceAlertDialog();
        }*/

// when app go in background and open it again show trip background map -- so remove on resume 10-03-2023

//        if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
//           /* if (startmap) {
//                startmap = false;*/
//            // startActivityTripBackground();
//        //    startTripMapActivity();
//            //}
//
//            if (sqlitewraper.isMockAvailable) {
//
//            } else {
//                startTripMapActivity();
//            }
//
//        }

        if (!TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true")) {
            MySharedPreferences editor = sqlitewraper.getSecureShared("MY_PREFS_NAME");
            editor.putInt("bootflag", 1);
            editor.commit();

            if (sqlitewraper.isMockAvailable) {
                displayAlert(getString(R.string.fake_location_string), 2);
                LocationManager lm = (LocationManager) sqlitewraper.context
                        .getSystemService(sqlitewraper.context.LOCATION_SERVICE);
                boolean isGPSEnabled = lm
                        .isProviderEnabled(LocationManager.GPS_PROVIDER);
                if (!isGPSEnabled) {
                    gpsonoff();
                }
            }
        }

        IntentFilter filter = new IntentFilter("android.location.PROVIDERS_CHANGED");
        this.registerReceiver(mReceivedSMSReceiver, filter);
        IntentFilter filter1 = new IntentFilter("com.easyform.CUSTOM_BROADCAST");
        this.registerReceiver(mReceivedSMSReceiver, filter1);
        B_new.setIsInBackgeound(false);

        internetBrodcast();
        registerBroadcast();

//        PowerManager powerManager = (PowerManager)
//                getApplicationContext().getSystemService(Context.POWER_SERVICE);
//        if (android.os.Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
//                && powerManager.isPowerSaveMode()) {
//            // Animations are disabled in power save mode, so just show a toast instead.
//            Toast.makeText(getApplicationContext(), "Power Saving Mode is ON", Toast.LENGTH_SHORT).show();
//        }

        Cursor a_t12 = database.rawQuery(
                "select value from APP_states where ITEAM ='gps'", null);
        a_t12.moveToFirst();
        int j1 = a_t12.getCount();

        String gps = null;
        if (a_t12.getCount() > 0) {

            gps = a_t12.getString(0);

            if (gps.equalsIgnoreCase("2")) {

                //for starting  the location services according to flag
                call();
            }
        }

        a_t12.close();
        LocationManager lm = (LocationManager) sqlitewraper.context
                .getSystemService(sqlitewraper.context.LOCATION_SERVICE);
        boolean isGPSEnabled = lm
                .isProviderEnabled(LocationManager.GPS_PROVIDER);
        String f_gps;
        if (!isGPSEnabled) {

            database = sqlitewraper.getDatabase();
            String checkgpsstate = checkgps();

            if (!checkgpsstate.equalsIgnoreCase("0")) {
                if (!isGPSEnabled) {
                    if (gpsflag != 1) {
                        gpsonoff();
                        gpsflag = 1;
                    }
                }

            }
        }


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
    private ScreenshotBroadcastReceiver screenshotReceiver;
    private boolean isReceiverRegistered = false;
    private void registerBroadcast() {
        IntentFilter intentFilter1 = new IntentFilter("android.intent.action.QUICKBOOT_POWERON");
        //activity_recognize receiver
        IntentFilter intentFilter2 = new IntentFilter("result");
        //Screen on off
        IntentFilter intentFilter3 = new IntentFilter("android.intent.action.USER_PRESENT");
        //Phone switch off
        IntentFilter intentFilter4 = new IntentFilter("android.intent.action.ACTION_SHUTDOWN");
        IntentFilter intentFilter5 = new IntentFilter("android.os.action.POWER_SAVE_MODE_CHANGED");
       // IntentFilter intentFilter = new IntentFilter("android.location.PROVIDERS_CHANGED");

       // this.registerReceiver(new gpsreciever(), intentFilter);
        this.registerReceiver(new phoneon(), intentFilter1);
        //this.registerReceiver(new BootReceiver(), intentFilter1);
       // this.registerReceiver(new activity_recognize(), intentFilter2);
        this.registerReceiver(new onreboot(), intentFilter3);
        this.registerReceiver(new ShutdownReceiver(), intentFilter4);
        this.registerReceiver(new PowerSaveModeReceiver(), intentFilter5);

        if (!isReceiverRegistered) {
            screenshotReceiver = new ScreenshotBroadcastReceiver();
            IntentFilter intentFilter = new IntentFilter("com.easyfrom.jitsi.SCREENSHOT_SAVED");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                this.registerReceiver(screenshotReceiver, intentFilter, Context.RECEIVER_EXPORTED);
            }
            isReceiverRegistered = true;
            Log.d("Receiver", "Receiver registered");
        }


        ComponentName receiver = new ComponentName(this, onreboot.class);
        PackageManager pm = this.getPackageManager();

        pm.setComponentEnabledSetting(receiver,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP);
    }

    private void showAttendanceAlertDialog() {
        Calendar c = Calendar.getInstance();
        int dayOfWeek = c.get(Calendar.DAY_OF_WEEK);
        SharedPreferences pref = sqlitewraper.context.getSharedPreferences("MyPref", 0);
        String value = pref.getString("daysstring", "");
        String flowID = pref.getString("FLOWID", "");

        SQLiteDatabase database = sqlitewraper.getDatabase();
        net.sqlcipher.Cursor c2_n = database.rawQuery(
                "select tid,notiflag,millisecond from task_master where moduleid=" + flowID, null);
        c2_n.moveToLast();
        int count = c2_n.getCount();
        if (count > 0) {
            String notiflag = c2_n.getString(1);
            String milliseconds = c2_n.getString(2);
            milliseconds = AttendanceClass.convertDate(milliseconds, "dd-MMM-yyyy");

            Date mDate = Calendar.getInstance().getTime();
            SimpleDateFormat df = new SimpleDateFormat("dd-MMM-yyyy");
            String currentData = df.format(mDate);

            if (notiflag.equalsIgnoreCase("1")) {
                // Show check out AlertDialog
                //  CheckSheetJsonConstant.getNotificationTime(0, dayOfWeek, value);
            } else {
                if (!milliseconds.equalsIgnoreCase(currentData)) {
                    // Show check in AlertDialog
                    showAlertDialogAttendance();
                }
            }
        } else {
            // Show check in AlertDialog
            showAlertDialogAttendance();
        }
    }

    public void showAlertDialogAttendance() {
        final AlertDialog.Builder dialog = new AlertDialog.Builder(this);
        dialog.setCancelable(false);
        dialog.setTitle("Attendance of the day");
        dialog.setMessage("Mark your attendance by CHECK IN for today");
        dialog.setPositiveButton("Check In", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                Intent faceRecognizerActivityIntent = new Intent(ph_s.this, FaceDetactionActivity.class);
                // faceRecognizerActivityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(faceRecognizerActivityIntent);
            }
        });
        dialog.setNegativeButton("cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.dismiss();
            }
        });
        dialog.show();

    }


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

    //for starting  the location services according to flag

    void call() {

        database = sqlitewraper.getDatabase();

        Cursor a_t = database.rawQuery(
                "select value from APP_states where ITEAM ='nick'", null);
        a_t.moveToFirst();
        String username = null;
        if (a_t.getCount() > 0) {

            username = a_t.getString(0);
        }
        a_t.close();

        if (!username.equalsIgnoreCase("0")) {
            //hide newfused and activity_recognition code  23-07-2025
//            boolean check = isMyServiceRunning(sqlitewraper.context,
//                    newfused_gps.class.getName());
//            if (check) {
//
//                Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
//                sqlitewraper.context.startService(i);
//
//            } else {
//
//                Intent i = new Intent(sqlitewraper.context, newfused_gps.class);
//                sqlitewraper.context.startService(i);
//
//
//            }

            boolean check2 = isMyServiceRunning(sqlitewraper.context,
                    newfused.class.getName());
            if (!check2) {
                Intent i = new Intent(sqlitewraper.context, newfused.class);
                sqlitewraper.context.startService(i);
            }

//            boolean check3 = isMyServiceRunning(sqlitewraper.context,
//                    Activity_recognition.class.getName());
//            if (!check3) {
//                Intent i = new Intent(sqlitewraper.context, Activity_recognition.class);
//                sqlitewraper.context.startService(i);
//            }
        }
    }

    private void displayAlert(String displayalert, final int alertflag) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setMessage(displayalert).setCancelable(
                false).setPositiveButton("Yes",
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        dialog.cancel();
                        if (alertflag == 0) {
                            startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));
//                            gpsonoff();

                        } else if (alertflag == 1) {
                            startActivityForResult(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS), 101);
//                            gpsonoff();

                        } else {
                            if (sqlitewraper.getMainactivity() != null) {
                                sqlitewraper.getMainactivity().finish();
                                System.exit(0);
                            }
                        }
                    }
                });
        AlertDialog alert = builder.create();
        if (alert.isShowing()) {
            alert.dismiss();
        }
        alert.show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);

        if (requestCode == 101) {
            fakeLocationCheck();
        }

        //In case user dosent on the GPS than Exit from the app
        if (requestCode == REQUEST_CHECK_SETTINGS) {

            if (resultCode == RESULT_OK) {
//                Toast.makeText(getApplicationContext(), "GPS enabled", Toast.LENGTH_LONG).show();
//                IntentFilter filter = new IntentFilter("android.location.PROVIDERS_CHANGED");
//                registerReceiver(new gpsreciever(), filter);
            } else {
//                Toast.makeText(getApplicationContext(), "GPS is not enabled", Toast.LENGTH_LONG).show();
                sqlitewraper.getMainactivity().finish();
                System.exit(0);
            }

        }
    }


    public void showAlertDialogAutostart(String message, final int count, String title) {

        AlertDialog alertDialog = new AlertDialog.Builder(this).create();
        alertDialog.setTitle(title);
        alertDialog.setCancelable(false);
        alertDialog.setMessage(message);
        alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {
                        dialog.dismiss();
//                        pref = sqlitewraper.context.getSharedPreferences("FIRSTTIME", MODE_PRIVATE);
                        pref = sqlitewraper.getSecureShared("FIRSTTIME");
//                        editor = pref.edit();
                        pref.putString("FIRSTTIME", "1"); // Saving string
//                        editor.apply();
                        pref.commit();
                        Log.d("##PH_S", "ondestroy2");
                        if (count == 0) {
                            autostartDifferentDevice(count);
                        }
                        if (count == 1) {
                            autostartDifferentDevice(count);
                        }
                    }
                });

        alertDialog.show();
    }

    //different device autostart
    public void autostartDifferentDevice(int count) {

        try {
            Intent intent = new Intent();
            String manufacturer = Build.MANUFACTURER;
            if ("xiaomi".equalsIgnoreCase(manufacturer)) {

                if (count == 0) {
                    intent.setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
                }
                if (count == 1) {
                    intent.setClassName("com.miui.powerkeeper",
                            "com.miui.powerkeeper.ui.HiddenAppsContainerManagementActivity");
                }

            } else if ("oppo".equalsIgnoreCase(manufacturer)) {

//                    intent.setComponent(new ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"));
                try {
                    intent = new Intent();
                    intent.setClassName("com.coloros.safecenter",
                            "com.coloros.safecenter.permission.startup.StartupAppListActivity");
                    startActivity(intent);
                } catch (Exception e) {
                    try {
                        intent = new Intent();
                        intent.setClassName("com.oppo.safe",
                                "com.oppo.safe.permission.startup.StartupAppListActivity");
                        startActivity(intent);
                    } catch (Exception ex) {
                        try {
                            intent = new Intent();
                            intent.setClassName("com.coloros.safecenter",
                                    "com.coloros.safecenter.startupapp.StartupAppListActivity");
                            startActivity(intent);
                        } catch (Exception exx) {

                            Log.d("##", exx.getMessage());
                        }
                    }
                }

            } else if ("vivo".equalsIgnoreCase(manufacturer)) {
//                    intent.setComponent(new ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));

                try {
                    intent = new Intent();
                    intent.setComponent(new ComponentName("com.iqoo.secure",
                            "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"));
                    startActivity(intent);
                } catch (Exception e) {
                    try {
                        intent = new Intent();
                        intent.setComponent(new ComponentName("com.vivo.permissionmanager",
                                "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));
                        startActivity(intent);
                    } catch (Exception ex) {
                        try {
                            intent = new Intent();
                            intent.setClassName("com.iqoo.secure",
                                    "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager");
                            startActivity(intent);
                        } catch (Exception exx) {
                            ex.printStackTrace();
                        }
                    }
                }

            } else if ("oneplus".equalsIgnoreCase(manufacturer)) {
                intent.setComponent(new ComponentName("com.oneplus.security", "com.oneplus.security.chainlaunch.view.ChainLaunchAppListAct‌​ivity"));
            } else if ("Letv".equalsIgnoreCase(manufacturer)) {
                intent.setComponent(new ComponentName("com.letv.android.letvsafe", "com.letv.android.letvsafe.AutobootManageActivity"));
            } else if ("Honor".equalsIgnoreCase(manufacturer)) {
//                intent.setComponent(new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"));
                intent.setComponent(new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity"));
            } else if ("huawei".equalsIgnoreCase(manufacturer)) {
//                intent.setComponent(new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"));
                intent.setComponent(new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity"));
            } else if ("asus".equalsIgnoreCase(manufacturer)) {
                intent.setComponent(new ComponentName("com.asus.mobilemanager", "com.asus.mobilemanager.autostart.AutoStartActivity"));
            }

            List<ResolveInfo> list = context.getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
            if (list.size() > 0) {
                context.startActivity(intent);
            }
        } catch (Exception e) {
//                Crashlytics.logException(e);
        }

    }

    @SuppressLint("BatteryLife")
    private void activateDozemode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {

            try {
                Intent intent = new Intent();
                String packageName = context.getPackageName();
                PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm.isIgnoringBatteryOptimizations(packageName))
                    intent.setAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                else {
                    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                }
                context.startActivity(intent);
            } catch (Exception e) {

                e.printStackTrace();
            }
        }
    }

    private String checkgps() {
        String gpsstate = null;

        Cursor c11 = database
                .rawQuery(
                        "SELECT VALUE FROM APP_states WHERE ITEAM = 'gps'",
                        null);

        if (c11.getCount() > 0) {
            c11.moveToFirst();
            gpsstate = c11.getString(0);

        }
        c11.close();

        return gpsstate;
    }

    @Override
    public void onConnected(@Nullable Bundle bundle) {
        LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder()
                .addLocationRequest(locationRequest);
        builder.setAlwaysShow(true);
        PendingResult result =
                LocationServices.SettingsApi.checkLocationSettings(
                        mGoogleApiClient,
                        builder.build()
                );

        result.setResultCallback(this);
    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {

    }

    @Override
    public void onResult(@NonNull Result result) {
        final Status status = result.getStatus();
        switch (status.getStatusCode()) {
            case LocationSettingsStatusCodes.SUCCESS:

                // NO need to show the dialog;

                break;

            case LocationSettingsStatusCodes.RESOLUTION_REQUIRED:
                //  Location settings are not satisfied. Show the user a dialog

                try {
                    // Show the dialog by calling startResolutionForResult(), and check the result
                    // in onActivityResult().

                    status.startResolutionForResult(ph_s.this, REQUEST_CHECK_SETTINGS);

                } catch (IntentSender.SendIntentException e) {

                    //failed to show
                }
                break;

            case LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE:
                // Location settings are unavailable so not possible to show any dialog now
                break;
        }
    }

    public void gpsonoff() {
        if(!ShowGPSAlert)
        {
            mGoogleApiClient = new GoogleApiClient.Builder(this)
                    .addApi(LocationServices.API)
                    .addConnectionCallbacks(this)
                    .addOnConnectionFailedListener(this).build();
            mGoogleApiClient.connect();

            locationRequest = LocationRequest.create();
            locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
            locationRequest.setInterval(30 * 1000);
            locationRequest.setFastestInterval(5 * 1000);
            ShowGPSAlert = true;
        }

    }

    //alert dialog message for diiferent devices
//    public void showAlertDialogAutostartalldevices() {
//        String title = "Allow Permission";
//        String brand = Build.MANUFACTURER;
//        String message = "Please Enable Autostart Application from Setting";
//        if (brand.equalsIgnoreCase("xiaomi")) {
//            message = "- Go to your phone's Settings app\n" +
//                    "- Select Additional Settings\n" +
//                    "- Go to Battery & Performance\n" +
//                    "- Tap on Manage apps’ battery usage\n" +
//                    "- On this screen switch off Power Saving Mode\n" +
//                    "- Tap on Saving Power in The Background\n" +
//                    "- Select Choose Application\n" +
//                    "- Go to Background Settings and switch to No Restrictions";
//        }
//        if (brand.equalsIgnoreCase("vivo")) {
//
//            message = "- Go to Settings on your VIVO device\n" +
//                    "- Select Battery Option\n" +
//                    "- Setect Normal Mode";
//
//        }
//        if (brand.equalsIgnoreCase("oppo")) {
//
//            message = "- Go to Settings on your OPPO device\n" +
//                    "- Go to Security Centre\n" +
//                    "- Click Privacy Permissions\n" +
//                    "- Click Start up Manager\n" +
//                    "- Allow Our Application to run in background.\n" +
//                    "- Go back to Settings\n" +
//                    "- Go to Battery\n" +
//                    "- Select Our Application!\n" +
//                    "- Switch off Freeze in Background and Automatically Optimize When an Abnormality is Detected";
//
//        }
//        if (brand.equalsIgnoreCase("htc")) {
//            message = "- Open up Phone Settings\n" +
//                    "- Tap Power\n" +
//                    "- Tap Battery optimization\n" +
//                    "- Tap Not optimized\n" +
//                    "- Select All apps to see the complete list of apps.\n" +
//                    "- Select App, and select Don't optimize";
//        }
//        if (brand.equalsIgnoreCase("huawei")) {
//
//            message = "- Go to Settings on your Huawei device\n" +
//                    "- Select Apps\n" +
//                    "- Tap Settings at the bottom of the screen\n" +
//                    "- Select Special Access\n" +
//                    "- Select Ignore Optimizations\n" +
//                    "- Select App, from the list and tap Allow\n" +
//                    "- Go to Phone Settings\n" +
//                    "- Go to Apps\n" +
//                    "- Select Application\n" +
//                    "- Tap on Battery\n" +
//                    "- Disable the Power-intensive prompt\n" +
//                    "- On the same page, switch Launch from Automatic to Manage Manually\n" +
//                    "- Enable all the Manage Manually options - these should include things such as 'Run in background'";
//
//        }
//        if (brand.equalsIgnoreCase("ZTE")) {
//            message = "- Open the Battery menu in the Settings app\n" +
//                    "- Select the 3-dot menu\n" +
//                    "- Tap Battery Optimisation\n" +
//                    "- Select App, and tap Don't Optimise\n" +
//                    "- Open your overview/recents screen which displays all of your recently used apps\n" +
//                    "- Tap the padlock icon in the top right hand corner of the App";
//        }
//
//        AlertDialog alertDialog = new AlertDialog.Builder(this).create();
//        alertDialog.setTitle(title);
//        alertDialog.setCancelable(false);
//        alertDialog.setMessage(message);
//        alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
//                new DialogInterface.OnClickListener() {
//                    public void onClick(DialogInterface dialog, int which) {
//                        dialog.dismiss();
//                        pref = sqlitewraper.getSecureShared("FIRSTTIME");
//                        pref.putString("FIRSTTIME", "1"); // Saving string
//                        pref.commit();
//                        if (Build.MANUFACTURER.equalsIgnoreCase("xiaomi")) {
//
//                            startActivityForResult(new Intent(Settings.ACTION_MANAGE_ALL_APPLICATIONS_SETTINGS), 0);
//
//                        }
//
//                        if (Build.MANUFACTURER.equalsIgnoreCase("oppo")) {
//                            Intent intent1 = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
//                            Uri uri1 = Uri.fromParts("package", getPackageName(), null);
//                            intent1.setData(uri1);
//                            startActivity(intent1);
//                        }
//                        if (Build.MANUFACTURER.equalsIgnoreCase("vivo")) {
//                            Intent intent1 = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
//                            Uri uri1 = Uri.fromParts("package", getPackageName(), null);
//                            intent1.setData(uri1);
//                            startActivity(intent1);
//                            boolean check = AutoStartPermissionHelper.getInstance().getAutoStartPermission(context);
//                            boolean supported = AutoStartPermissionHelper.getInstance().isAutoStartPermissionAvailable(context);
//
//                            Log.d("##log", check + "/" + supported);
////                            startActivityForResult(new Intent(Settings.ACTION_MANAGE_APPLICATIONS_SETTINGS), 0);
//
//                        }
//
//                        if (Build.MANUFACTURER.equalsIgnoreCase("oneplus")) {
//                            startActivityForResult(new Intent(Settings.ACTION_MANAGE_ALL_APPLICATIONS_SETTINGS), 0);
//                        }
//
//                        if (Build.MANUFACTURER.equalsIgnoreCase("huawei")) {
//                            Intent intent2 = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
//                            Uri uri2 = Uri.fromParts("package", getPackageName(), null);
//                            intent2.setData(uri2);
//                            startActivity(intent2);
//                        }
//                        if (Build.MANUFACTURER.equalsIgnoreCase("htc")) {
//                            Intent intent3 = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
//                            Uri uri3 = Uri.fromParts("package", getPackageName(), null);
//                            intent3.setData(uri3);
//                            startActivity(intent3);
//                        }
//                    }
//                });
//
//        alertDialog.show();
//    }
    /*@Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                PictureInPictureParams.Builder mPictureInPictureParamsBuilder =
                        new PictureInPictureParams.Builder().setAspectRatio(getPipRatio());
                if (!isInPictureInPictureMode()) {
                    enterPictureInPictureMode(mPictureInPictureParamsBuilder.build());
                }
            } else {
                Toast.makeText(ph_s.this, "Picture in picture mode is not supported in your device", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(ph_s.this, "Minimize not supported.", Toast.LENGTH_SHORT).show();
        }
    }*/

    //home button press logic for trip background map
    private void homeButtonClicked() {

        final HomeWatcher mHomeWatcher = new HomeWatcher(context);
        mHomeWatcher.setOnHomePressedListener(new OnHomePressedListener() {
            @Override
            public void onHomePressed() {
                // do something here...
                MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                String isTripPauseAfterTask = pref.getString("isTripPauseAfterTask","false");

                Log.d("##PHS", "HOMEBUTTONPRESSED");
                if (tripStatus() > 0) {
                    if(!isTripPauseAfterTask.equalsIgnoreCase("true"))
                    {
                        if(!checkpermissionfirstattempt.equalsIgnoreCase("1"))
                        {
                            ShowDialog = "false";
                        }
                        if (!LocationOutageUtils.isPiP) {
                            boolean check = isMyServiceRunning(sqlitewraper.context,
                                    FloatingBubbleService.class.getName());

                            if(check)
                            {}
                            else {
                                final Handler handler = new Handler();
                                handler.postDelayed(() -> {
                                    Intent intent = new Intent(ph_s.this, TripBackgroundMapActivity.class);
                                    intent.putExtra("IsOpenMAP","1");
                                    startActivity(intent);
                                }, 1000);
                                //when trip is running and app minimize at time trip map is not open
                                // when manufacturer name is xiaomi at time start timer and timer is finish send notification
                                handler.postDelayed(() -> {
                                    try{
                                        if ("xiaomi".equals(Build.MANUFACTURER.toLowerCase(Locale.ROOT))) {
                                            timer = new CountDownTimer(TIMER_DURATION, TIMER_DURATION) {
                                                @Override
                                                public void onTick(long millisUntilFinished) {
                                                    // Not needed for this example
                                                }
                                                @Override
                                                public void onFinish() {
                                                    Handler mHandler = new Handler();
                                                    mHandler.postDelayed(() -> {
                                                        if(!checkpermissionfirstattempt.equalsIgnoreCase("1"))
                                                        {
                                                            sendNotification();
                                                        }
                                                    }, 200);

                                                }
                                            }.start();
                                        }
                                    }
                                    catch (Exception e)
                                    {

                                    }
                                }, 1000);

                            }
                    }

                    }
//                  mHomeWatcher.stopWatch();
                }
                else {
                    pref = sqlitewraper.getSecureShared("MyPref");
                    String ismapcheck;
                    ismapcheck = pref.getString("IsMapcheck","false");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        if (ismapcheck.equalsIgnoreCase("true"))
                        {
                           // stopService(new Intent(ph_s.this,FloatingBubbleService.class));
                            pref.putString("IsMapcheck","false");
                            pref.commit();
                            sqlitewraper.getMainactivity().finish();
                            System.exit(0);
                        }
                    }
                }
            }

            @Override
            public void onHomeLongPressed() {
            }

            @Override
            public void onHomeGestureCalled() {
                try {
                    if (checkOverlayDisplayPermission()) {
                        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
                        String isTripPauseAfterTask = pref.getString("isTripPauseAfterTask","false");

                        if (tripStatus() > 0) {

                            if(!isTripPauseAfterTask.equalsIgnoreCase("true")) {
                                if (!LocationOutageUtils.isPiP) {
                                    boolean check = isMyServiceRunning(sqlitewraper.context,
                                            FloatingBubbleService.class.getName());

                                    if (check) {
                                    } else {
                                        final Handler handler = new Handler();
                                        handler.postDelayed(() -> {
                                            Intent intent = new Intent(ph_s.this, TripBackgroundMapActivity.class);
                                            // intent.setFlags(intent.FLAG_ACTIVITY_NEW_TASK);
                                            intent.putExtra("IsOpenMAP", "1");
                                            startActivity(intent);
                                        }, 1000);


                                        if ("xiaomi".equals(Build.MANUFACTURER.toLowerCase(Locale.ROOT))) {
                                            timer = new CountDownTimer(TIMER_DURATION, TIMER_DURATION) {
                                                @Override
                                                public void onTick(long millisUntilFinished) {
                                                    // Not needed for this example
                                                }

                                                @Override
                                                public void onFinish() {
                                                    Handler mHandler = new Handler();
                                                    mHandler.postDelayed(() -> {
                                                        if (!checkpermissionfirstattempt.equalsIgnoreCase("1")) {
                                                            sendNotification();
                                                        }
                                                    }, 200);

                                                }
                                            }.start();
                                        }
                                    }
                                }
                            }
                        }
                        else {
                        pref = sqlitewraper.getSecureShared("MyPref");
                        String ismapcheck;
                        ismapcheck = pref.getString("IsMapcheck","false");
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            if (ismapcheck.equalsIgnoreCase("true"))
                            {
                               // stopService(new Intent(ph_s.this,FloatingBubbleService.class));
                                pref.putString("IsMapcheck","false");
                                pref.commit();
                                sqlitewraper.getMainactivity().finish();
                                System.exit(0);
                            }
                        }
                    }
                   }

                } catch (Exception e) {
                    //Log.e("startPictureInPicture : ", e.toString());
                }
            }
        });
        mHomeWatcher.startWatch();
    }

    private boolean checkOverlayDisplayPermission() {
        // Android Version is lesser than Marshmallow or
        // the API is lesser than 23
        // doesn't need 'Display over other apps' permission enabling.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.M) {
            // If 'Display over other apps' is not enabled
            // it will return false or else true
            if (!Settings.canDrawOverlays(this)) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    void startPictureInPicture() {

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!isInPictureInPictureMode()) {
                    PictureInPictureParams mPictureInPictureParams =
                            new PictureInPictureParams.Builder()
                                    // .setAspectRatio(getPipRatio())
                                    .build();
                    enterPictureInPictureMode(mPictureInPictureParams);
                }
            } else {
                LogUtils.writeRfTrackLogToFile("Picture in picture mode is not supported in your device", "startPictureInPicture " + this.getClass().getName());
                Toast.makeText(ph_s.this, "Picture in picture mode is not supported in your device", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            LogUtils.writeRfTrackLogToFile("Exception : " + e.toString(), "startPictureInPicture " + this.getClass().getName());
            Log.e("startPictureInPicture : ", e.toString());
            Toast.makeText(ph_s.this, "Minimize not supported.", Toast.LENGTH_SHORT).show();
        }
    }

    public void pictureInPictureHomeClicked(boolean isWatcher) {
        Log.d("pictureInPictureHomeClicked", "is called");
        HomeWatcher mHomeWatcher = new HomeWatcher(getApplicationContext());
        mHomeWatcher.setOnHomePressedListener(new OnHomePressedListener() {
            @Override
            public void onHomePressed() {
                Log.d("pictureInPictureHomeClicked", "onHomePressed Celled");
                LogUtils.writeRfTrackLogToFile("onHomePressed  Celled", "onHomePressed " + ph_s.this.getClass().getName());
                startPictureInPicture();
            }

            @Override
            public void onHomeLongPressed() {
                LogUtils.writeRfTrackLogToFile("onHomeLongPressed  Celled", "onHomeLongPressed " + ph_s.this.getClass().getName());
                Log.d("pictureInPictureHomeClicked", "onHomeLongPressed Celled");
                // startPictureInPicture();
            }

            @Override
            public void onHomeGestureCalled() {
                //startPictureInPicture();
            }
        });
        if (isWatcher) {
            mHomeWatcher.startWatch();
        }
    }

    public Rational getPipRatio() {
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        return new Rational(Math.round(metrics.xdpi), Math.round(metrics.ydpi));
    }

    void startActivityTripBackground() {
        Intent intent1 = new Intent(ph_s.this, TripBackgroundMapActivity.class);
        startActivity(intent1);
    }

    //check if there is any trip running or not
    private static int tripStatus() {

        SQLiteDatabase database = sqlitewraper.getDatabase();

        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        Log.d("TripCount ", tripflagCount + "");
        tripflag.close();
        return tripflagCount;
    }


    private void startTripMapActivity() {

        if (tripStatus() > 0) {

            if (!LocationOutageUtils.isPiP) {

                if (!TripMapUtils.isIsBypassActivity()) {
                    Intent intent = new Intent(ph_s.this, TripBackgroundMapActivity.class);
                    /*intent.setFlags(intent.FLAG_ACTIVITY_CLEAR_TOP);*/
                    startActivity(intent);
                }
            }
        }
        TripMapUtils.setIsBypassActivity(false);
    }


    private BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (sqlitewraper.getFakeflag() == 1) {
                showAlertDialogFakeLocation();
            }
        }
    };


    public void showAlertDialogFakeLocation() {

        AlertDialog alertDialog = new AlertDialog.Builder(this).create();
        alertDialog.setTitle("Fake Location");
        alertDialog.setCancelable(false);
        alertDialog.setMessage("You are using mock location please disable it otherwise you can not use this application");
        alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "OK",
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int which) {

                        MySharedPreferences editor = sqlitewraper.getSecureShared("MY_PREFS_NAME");
                        editor.putInt("bootflag", 1);
                        editor.commit();

                        dialog.dismiss();
                        isDialogShowing = false;
                        FakeLocationUtils.checkTodaysEntryandInsertIntoDatabse();
                        sqlitewraper.getMainactivity().finish();
                        System.exit(0);
                    }
                });

        if (!isDialogShowing) {
            alertDialog.show();
            isDialogShowing = true;
        }
    }


    //check device time auto or manual
    private void checkDeviceTime() {
        try {
            int hh = Settings.Global.getInt(getContentResolver(), Settings.Global.AUTO_TIME);
            Log.d("##TIMEZONE", String.valueOf(hh));
            if (hh == 0) {
                showAlertDialogTimeDetect(this, "Please set time as Automatic/Network provided time from time setting.");
            }
        } catch (Settings.SettingNotFoundException e) {
            e.printStackTrace();
            Log.d("##TIMEZONE", String.valueOf(e.getMessage()));
        }
    }

    public void showAlertDialogTimeDetect(Activity activity, String msg) {
        final Dialog dialog = new Dialog(activity);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false);
        dialog.setContentView(R.layout.timedetection_dialog);

        TextView text = dialog.findViewById(R.id.text_dialog);
        text.setText(msg);

        Button dialogButton = dialog.findViewById(R.id.btn_dialog);
        dialogButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialog.dismiss();
                startActivityForResult(new Intent(Settings.ACTION_DATE_SETTINGS), 0);
            }
        });
        if (!dialog.isShowing()) {
            dialog.show();
        }
    }

    public void Locationpermissioncheck()
    {
        int bgLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION);
        int coarseLocation = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION);

        boolean isAppLocationPermissionGranted = (bgLocation == PackageManager.PERMISSION_GRANTED) &&
                (coarseLocation == PackageManager.PERMISSION_GRANTED);
      AlertDialog alertDialog = null;
        if (!isAppLocationPermissionGranted) {
            alertDialog = new AlertDialog.Builder(this).create();
            alertDialog.setTitle("Missing Permission!");
            alertDialog.setCancelable(false);
            alertDialog.setMessage("This app requires your location access all the time.\n\nin your mobile go to :  Permissions > Location > Select Allow all the time\n");
            alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "Allow in Settings",
                    (dialog, which) -> {
                        dialog.dismiss();
                        Intent intent = new Intent();
                        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                        mainactivity.startActivity(intent);
                        alltimelocation = false;
//                        finish();
                    });

            if(!alltimelocation) {
                alertDialog.show();
                alltimelocation = true;
            }
        }
        else {

            if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
            {
                notificationpermissioncheck();
            }

        }
    }

    @RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
    public void notificationpermissioncheck()
    {
        int notificationpermission = ContextCompat.checkSelfPermission(ph_s.this, Manifest.permission.POST_NOTIFICATIONS);
        boolean isnotificationPermissionGranted =(notificationpermission == PackageManager.PERMISSION_GRANTED);
        AlertDialog alertDialog = new AlertDialog.Builder(this).create();
        if(!isnotificationPermissionGranted)
        {

            alertDialog.setTitle("Enable Permission!");
            alertDialog.setCancelable(false);
            alertDialog.setMessage("This app requires notification access.\n\nin your mobile go to : Notification > Enable Notification \n");
            alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "Allow in Settings",
                    (dialog, which) -> {
                        dialog.dismiss();
                        Intent intent = new Intent();
                        intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                        intent.setData(Uri.fromParts("package", mainactivity.getPackageName(), null));
                        mainactivity.startActivity(intent);
                        isShowNotiDialog = false;
                        //finish();
                    });
            if(!isShowNotiDialog)
            {
                alertDialog.show();
                isShowNotiDialog = true;
            }
        }
        else {

            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    alertDialog.dismiss();
                }
            }, 100);

        }
    }
    private boolean isActivityAvailable(Context context, Intent intent) {
        PackageManager packageManager = context.getPackageManager();
        List<ResolveInfo> activities = packageManager.queryIntentActivities(intent, 0);
        return activities != null && activities.size() > 0;
    }

    public void CheckPermissionXioami()
    {
        try {
            pref = sqlitewraper.getSecureShared("CHECKFIRSTTIMEPERMISSION");
            checkpermissionfirstattempt = pref.getString("CHECKFIRSTTIMEPERMISSION", "0");

        } catch (Exception e) {
            e.printStackTrace();
        }

        if(!ShowDialog.equalsIgnoreCase("true"))
        {
            if(!checkpermissionfirstattempt.equalsIgnoreCase("1")) {
                if (TripMapUtils.TRIPMAPBACK.equalsIgnoreCase("true")) {
                    if ("xiaomi".equals(Build.MANUFACTURER.toLowerCase(Locale.ROOT))) {
                        AlertDialog alertDialog = new AlertDialog.Builder(this).create();
                        alertDialog.setTitle("Please Enable the additional permissions!");
                        alertDialog.setCancelable(false);
                        alertDialog.setMessage("To enable the popup window permission, please follow these steps:\n\nClick Other permission >  Tap on 'Display pop-up windows while running in the background' > Always allow");
                        alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "Allow in Settings",
                                (dialog, which) -> {
                                    Intent intent = new Intent("miui.intent.action.APP_PERM_EDITOR");
                                    intent.setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity");
                                    intent.putExtra("extra_pkgname", getPackageName());
                                    boolean isActivityAvailable = isActivityAvailable(context, intent);

                                    pref = sqlitewraper.getSecureShared("Firsttime_Xiaomi");
                                    pref.putString("Firsttime_Xiaomi", "1"); // Saving string
                                    pref.commit();
                                    if (isActivityAvailable) {
                                        dialog.dismiss();
                                        startActivity(intent);
                                        ShowDialog = "true";
                                        isbackgroundDialogShowing = false;
                                    } else {
                                        dialog.dismiss();
                                        ShowDialog = "true";
                                        isbackgroundDialogShowing = false;
                                    }
                                });

                        if(!isbackgroundDialogShowing)
                        {
                            alertDialog.show();
                            isbackgroundDialogShowing = true;
                        }
                    }
                }
            }
        }
    }

    // notification send when xiaomi device is not allow popup window while app running in background (2-1-2024)
    private void sendNotification() {
        // Create an explicit intent to open the desired settings page
        Intent intent = new Intent("miui.intent.action.APP_PERM_EDITOR");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity");
        intent.putExtra("extra_pkgname", getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + sqlitewraper.context.getPackageName() + "/" + R.raw.trip_sound);

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(context,"channel_id")
                .setSmallIcon(R.drawable.atc_logo)
                .setAutoCancel(false)
                .setOngoing(true)
                .setContentTitle("Permission required for trip")
                .setStyle(new NotificationCompat.BigTextStyle().bigText("Click on Allow in setting then app will redirect to  Other Permissions then please click on Other Permissions and Allow Display pop-up window while running in background"))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setContentIntent(pendingIntent)
                .addAction(android.R.drawable.arrow_down_float, "Allow in setting", pendingIntent);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String channelId = "channel_id";
            String channelName = "Channel Name";
            int importance = NotificationManager.IMPORTANCE_DEFAULT;
            Ringtone r = RingtoneManager.getRingtone(sqlitewraper.context, sound);
            r.play();
            NotificationChannel channel = new NotificationChannel(channelId, channelName, importance);
            notificationManager.createNotificationChannel(channel);
        }
        notificationManager.notify(12, notificationBuilder.build());

    }

    public void  OpenSetting_vivodevice()
    {
        if ("vivo".equals(Build.MANUFACTURER.toLowerCase(Locale.ROOT))) {
            AlertDialog alertDialog = new AlertDialog.Builder(this).create();
            alertDialog.setTitle("Disable Battery Optimization");
            alertDialog.setCancelable(false);
            alertDialog.setMessage("You have to disable battery optimization in below steps\n 1.Go to Settings on your phone and tap Battery\n" +
                    "2.tap Background power consumption management.\n" +
                    "3.Select App and Select the Don’t restrict background power usage option.");
            alertDialog.setButton(AlertDialog.BUTTON_NEUTRAL, "Allow in Settings",
                    (dialog, which) -> {
                        pref = sqlitewraper.getSecureShared("FIRSTTIMEVIVO");
                        pref.putString("FIRSTTIMEVIVO", "1"); // Saving string
                        pref.commit();
                        Intent intent = new Intent(Settings.ACTION_SETTINGS);
                        startActivity(intent);
                    });


            alertDialog.show();

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
                startActivityForResult(intent, 1012);
                //  finish();
                isoverlyaDialog = false;
            }
        });
        if(!isoverlyaDialog)
        {
            dialog = builder.create();
            dialog.show();
            isoverlyaDialog = true;
        }

    }

    public static boolean isNotificationListenerEnabled(Context context) {
        // Get the component name of the notification listener service
        ComponentName cn = new ComponentName(context, NotificationListener.class);

        // Get the enabled notification listener services
        String flat = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");

        // Check if the component name is present in the enabled notification listener services
        return flat != null && flat.contains(cn.flattenToString());
    }
    public boolean isNotificationServiceEnabled(Context context) {
        String enabledServices = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
        String packageName = context.getPackageName();
        return enabledServices != null && enabledServices.contains(packageName);
    }
    public void requestNotificationaccess() {
        int NotificationListner = ContextCompat.checkSelfPermission(ph_s.this, Manifest.permission.BIND_NOTIFICATION_LISTENER_SERVICE);
        boolean NotificationListnerGranted =(NotificationListner == PackageManager.PERMISSION_GRANTED);

        if(!NotificationListnerGranted)
        {
            AlertDialog dialog;
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setCancelable(false);
            builder.setTitle("Notification access");
            builder.setMessage("This app requires 'Notification access' permission from System Settings.");
            builder.setPositiveButton("Allow in Settings", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                    startActivity(intent);
                    // finish();
                    isnotificationDialog = false;
                }
            });
            if(!isnotificationDialog)
            {
                dialog = builder.create();
                dialog.show();
                isnotificationDialog = true;
            }

        }


    }

    // check which html page load
    public static String getCurrentHtmlUrl() {
        if (instance != null && instance.appView != null) {
            return instance.appView.getUrl();
        }
        return null;
    }
}
