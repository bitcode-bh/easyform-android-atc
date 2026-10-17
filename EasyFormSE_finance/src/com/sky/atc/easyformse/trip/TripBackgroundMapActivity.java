package com.sky.atc.easyformse.trip;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.PictureInPictureParams;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.appcompat.app.AppCompatActivity;

import android.os.PowerManager;
import android.util.Log;
import android.util.Rational;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.datautils.HomeWatcher;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.gpsreciever;
import com.sky.atc.easyformse.ph_s;
import com.sky.atc.easyformse.sqlitewraper;
import net.sqlcipher.database.SQLiteDatabase;
import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import static com.sky.atc.easyformse.sqlitewraper.context;

import java.util.Locale;

//Showing Backgrond Map for trip
@StringFogIgnore
public class TripBackgroundMapActivity extends AppCompatActivity implements OnMapReadyCallback {

    GoogleMap map;
    Button btnBack;
    Button btnMinimize;
    private static long startMilli;
    TextView txtWarning;
    private static boolean isValidClose;
    MySharedPreferences pref ;
    String IsMAPOPEN = "false";
    Intent mIntent;
    Bundle mBundle;
    public static Activity mActivity;
//    private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller";
//    private static volatile PowerManager.WakeLock lockStatic = null;
//    LocationRequest mLocationRequest;
//    private PowerManager.WakeLock lock;
//    @SuppressLint("InvalidWakeLockTag")
//    synchronized private static PowerManager.WakeLock getLock(Context context) {
//        if (lockStatic == null) {
//            PowerManager mgr = (PowerManager) context.getApplicationContext()
//                    .getSystemService(Context.POWER_SERVICE);
//
//            if (mgr != null) {
//                lockStatic = mgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
//                        LOCK_NAME_STATIC);
//            }
//            lockStatic.setReferenceCounted(true);
//        }
//
//        return (lockStatic);
//    }
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.trip_backgroundmap);
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager().findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);
//        lock = getLock(this.getApplicationContext());
//        if (!lock.isHeld()) {
//            lock.acquire();
//        }
        mActivity = TripBackgroundMapActivity.this;
        pref = sqlitewraper.getSecureShared("MyPref");
        btnBack = findViewById(R.id.btn_easyform);
        btnMinimize = findViewById(R.id.btn_minimize);
        txtWarning = findViewById(R.id.txt_maintext);
        txtWarning.setVisibility(View.VISIBLE);
        isGoBack = false;
        insertEventIntoJson();

        mIntent = getIntent();
        if(mIntent != null)
        {
            IsMAPOPEN = mIntent.getStringExtra("IsOpenMAP");

        }
        if(IsMAPOPEN.equalsIgnoreCase("1"))
        {
            if ("xiaomi".equals(Build.MANUFACTURER.toLowerCase(Locale.ROOT)))
            {
                pref = sqlitewraper.getSecureShared("CHECKFIRSTTIMEPERMISSION");
                pref.putString("CHECKFIRSTTIMEPERMISSION", "1"); // Saving string
                pref.commit();
            }
        }
        LocalBroadcastManager.getInstance(this).registerReceiver(mMessageReceiver,
                new IntentFilter("trip-background-map"));

        LocalBroadcastManager.getInstance(this).registerReceiver(mtripEndReceiver,
                new IntentFilter("trip-end-event"));

        btnBack.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    isValidClose = true;
                    isGoBack = true;
                    // press back button redirect to main app 27-1-2023
                     try {
                        Intent intent = new Intent(TripBackgroundMapActivity.this, ph_s.class);
                         intent.putExtra("IsOpenMAP","0");
                        intent.setFlags(intent.FLAG_ACTIVITY_CLEAR_TOP);
                        startActivity(intent);
                    } catch (Exception e) {
                        e.printStackTrace();
                        Intent intent = new Intent(TripBackgroundMapActivity.this, ph_s.class);
                         intent.putExtra("IsOpenMAP","0");
                        intent.setFlags(intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    }
                    pref.putString("IsMapcheck","false");
                    pref.commit();
//                    onBackPressed();
//                    finish();
                    TripMapUtils.setIsBypassActivity(true);
                } catch (Exception e) {
                    e.printStackTrace();
                    Toast.makeText(context, "TRIP:Something goes wrong", Toast.LENGTH_SHORT).show();
                }
            }
        });

        //btn minimize for PIP mode
        btnMinimize.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                startPictureInPictureFeature();
            }
        });

    }

    private void startPictureInPictureFeature() {

        try {

            // click minimize button create floating bubble remove pip code 13-12-2023
//                pref.putString("IsMapcheck","true");
//                pref.commit();
//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//                startForegroundService(new Intent(context, FloatingBubbleService.class));
//            }
//            else {
//                startService(new Intent(context, FloatingBubbleService.class));
//            }
//            finish();

//            else {
            PackageManager packageManager = getPackageManager();
            if (packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        LocationOutageUtils.isPiP = true;
                        PictureInPictureParams.Builder mPictureInPictureParamsBuilder =
                                new PictureInPictureParams.Builder();
                        boolean result =  enterPictureInPictureMode(mPictureInPictureParamsBuilder.build());

                        if(!result)
                        {
                            Toast.makeText(this, "Picture-in-Picture mode is disabled. Please enable it in settings.", Toast.LENGTH_SHORT).show();

                            Intent intent = new Intent("android.settings.PICTURE_IN_PICTURE_SETTINGS",
                                    Uri.parse("package:" + getPackageName()));
                            startActivity(intent);
                        }
                        pref.putString("IsMapcheck", "true");
                        pref.commit();
                    } else {
                        pref.putString("IsMapcheck", "false");
                        pref.commit();
                        Toast.makeText(this, "Picture in picture mode is not supported in your device", Toast.LENGTH_SHORT).show();
                    }
            }
            else {
                // Picture-in-Picture mode is not supported on this device
                Toast.makeText(this, "Picture-in-Picture mode Feature is not available in this device", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Minimize not supported.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        map = googleMap;
        addMarker(DeviceEventsUtils.getCurrentLatLng().latitude, DeviceEventsUtils.getCurrentLatLng().longitude);

    }

//    @Override
//    protected void onUserLeaveHint() {
//        super.onUserLeaveHint();
//        startPictureInPictureFeature();
//    }


    private void addMarker(double lattitude, double longitude) {

        LatLng latLng = new LatLng(lattitude, longitude);
        MarkerOptions markerOptions = new MarkerOptions();
        markerOptions.position(latLng);
        map.clear();
        markerOptions.title("Current Position");
        markerOptions.icon(BitmapDescriptorFactory.fromResource(R.drawable.locationvehical72));
        markerOptions.getPosition();
        map.addMarker(markerOptions);
        map.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 14.0f));

    }

    //to get live location from loc_change
    private BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            // Get extra data included in the Intent
            String lattitude = intent.getStringExtra("lat");
            String longitude = intent.getStringExtra("long");
            addMarker(Double.parseDouble(lattitude), Double.parseDouble(longitude));
        }
    };

    private BroadcastReceiver mtripEndReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            startMilli = 0;
        }
    };

    @Override
    protected void onDestroy() {
        super.onDestroy();

        startMilli = System.currentTimeMillis();

//        if (!isValidClose){
//            if (DeviceEventsUtils.liveTripCount()>0) {
//                startActivity(new Intent(this, TripBackgroundMapActivity.class));
//            }
//        }
        LocalBroadcastManager.getInstance(this).unregisterReceiver(mMessageReceiver);
        Log.d("##TRIPBACKGROUDestory", "false");
        LocationOutageUtils.isPiP = false;

    }

    @Override
    protected void onResume() {
        super.onResume();
        isGoBack = false;
        isValidClose = false;

        if (!TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true")) {
            if (sqlitewraper.isMockAvailable) {
                MySharedPreferences editor = sqlitewraper.getSecureShared("MY_PREFS_NAME");
                editor.putInt("bootflag", 0);
                editor.commit();

                isValidClose = true;
                isGoBack = true;
                finish();
                TripMapUtils.setIsBypassActivity(false);
               // displayAlert(getString(R.string.fake_location_string));
            }
        }
    }

    boolean isGoBack = false;

    @Override
    public void onBackPressed() {
        if (isGoBack) {
            super.onBackPressed();
        } else {
            // press back minimize app 27-12-2023
            Toast.makeText(this, "Your trip is running... please do not close the application", Toast.LENGTH_SHORT).show();
            pref.putString("IsMapcheck","true");
            pref.commit();
           // startService(new Intent(context, FloatingBubbleService.class));
           // finish();
           // super.onBackPressed();
        }
    }

    private void insertEventIntoJson() {

        if (startMilli != 0) {

            long stopMilli = System.currentTimeMillis();
            long stopduration = stopMilli - startMilli;

            boolean isInserted = DeviceEventsUtils.insertIntoEvents(String.valueOf(startMilli), String.valueOf(stopMilli), String.valueOf(stopduration), "background");
            startMilli = 0;
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPIPMode) {
        if (isInPIPMode) {
            //Hide your clickable components
            Log.d("##TRIPBACKGROUND", String.valueOf(isInPIPMode));
            LocationOutageUtils.isPiP = true;
            txtWarning.setVisibility(View.GONE);

        } else {
            //Show your clickable components
            Log.d("##TRIPBACKGROUND", String.valueOf(isInPIPMode));
            LocationOutageUtils.isPiP = false;
            txtWarning.setVisibility(View.VISIBLE);
        }
        super.onPictureInPictureModeChanged(isInPIPMode);
    }

}

