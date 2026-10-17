/***
 * Copyright (c) 2010 CommonsWare, LLC
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.sky.atc.easyformse;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.StrictMode;
import android.os.SystemClock;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import android.telephony.PhoneStateListener;
import android.telephony.TelephonyCallback;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationAvailability;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.sky.atc.easyformse.datautils.DataUtils;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.location.SpeedCalculation;
import com.sky.atc.easyformse.trip.SpeedViolation;
import com.sky.atc.easyformse.trip.TripMapUtils;
import com.sky.atc.easyformse.trip.engine.DrivingContext;
import com.sky.atc.easyformse.trip.engine.Fix;
import com.sky.atc.easyformse.trip.engine.HeldEventStore;
import com.sky.atc.easyformse.trip.engine.MotionFeatureLogger;
import com.sky.atc.easyformse.trip.engine.MotionTimeline;
import com.sky.atc.easyformse.trip.engine.SiteIndex;
import com.sky.atc.easyformse.trip.engine.TerrainTracker;
import com.sky.atc.easyformse.trip.engine.FixValidator;
import com.sky.atc.easyformse.trip.engine.PositionEstimator;
import com.sky.atc.easyformse.trip.engine.TripDistanceMeter;
import com.sky.atc.easyformse.trip.engine.TripEngineStore;

import net.sqlcipher.Cursor;
import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONObject;

import java.util.Timer;
import java.util.TimerTask;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

import android.media.AudioManager;

/**
 * Service providing the guts of the location polling engine. Uses a WakeLock to
 * ensure the CPU stays on while the location lookup is going on. Handles both
 * successful and timeout conditions.
 * <p>
 * Those wishing to leverage this service should do so via the LocationPoller
 * class.
 */
@StringFogIgnore
public class newfused extends Service implements LocationListener {
    private static final String LOCK_NAME_STATIC = "com.commonsware.cwac.locpoll.LocationPoller";
    static int mockalert = 1;
    private static volatile PowerManager.WakeLock lockStatic = null;
    LocationRequest mLocationRequest;
    private PowerManager.WakeLock lock;
    LocationRequest request;
    data d = new data();
    private SQLiteDatabase database;
    // meters
    GoogleApiClient mGoogleApiClient;
    MySharedPreferences pref;
    String lat_check;
    int check = 0;

    NotificationChannel mChannel = null;
    String CHANNEL_ID = "my_channel_01";

    MySharedPreferences sharedPreferences;
    private final static int DELAY = 30000;
    private Timer timer = new Timer();

    //New Location Method
    private FusedLocationProviderClient fusedLocationClient;
    private static LocationCallback locationCallback;
    private LocationRequest locationRequest;
    /**
     * Lazy-initializes the WakeLock when we first use it. We use a partial
     * WakeLock since we only need the CPU on, not the screen.
     */

    private TelephonyManager telephonyManager;

    private PhoneStateListener phoneStateListener;
    private TelephonyCallback telephonyCallback;

    private  long callStartTime = 0;
    private  long callEndTime = 0;
    private Location latestLocation;

    private Location callStartLocation;
    private Location callEndLocation;
    private boolean isCallListenerRegistered = false;
    private int lastCallState = -1;

    private float callStartSpeed = 0f;
    private float maxSpeedDuringCall = 0f;
    private long maxSpeedMilli = 0L;
    private boolean speedViolation ;
    private boolean callEventInserted = false;
    private boolean simCallActive = false;

    // Trip engine (ported from OG Trip Tracker): trusted-fix checks, position smoothing and the
    // distance meter. It replaces the IMU Kalman filter, which assumed a flat, forward-facing phone
    // and kept the motion sensors at full rate all day.
    private final PositionEstimator positionEstimator = new PositionEstimator();
    private final TripDistanceMeter distanceMeter = new TripDistanceMeter();
    private Fix lastTrustedFix = null;
    private long lastTrustedMs = 0L;
    private double degradedMeters = 0;
    private static final float DEGRADED_MAX_ACC_M = 35f;
    private static final long DEGRADED_AFTER_MS = 8_000L;
    private Location turnAnchor = null;
    private float turnAnchorBearing = 0f;
    private static final float TURN_POINT_DEG = 20f;
    private static final float TURN_POINT_MIN_M = 20f;
    private static final float TURN_ANCHOR_REFRESH_M = 150f;
    private final MotionTimeline timeline = new MotionTimeline();
    private final SiteIndex siteIndex = new SiteIndex();
    // Road and surroundings over the last 2 minutes (GPS quality, bends, climbs, city/highway).
    private final TerrainTracker terrain = new TerrainTracker();
    private long lastEstimatorFixMs = 0L;
    private float lastBearingDeg = Float.NaN;
    private String meterTid = null;
    private long meterSavedMs = 0L;
    private String liveTid = null;
    private long liveTidCheckedMs = 0L;
    private String vehicleType = "Private-2W";
    // Bike-vs-car training data, collected on live trips only (see MotionFeatureLogger).
    private MotionFeatureLogger featureLogger;
    private long lastForwardElapsedMs = 0L;
    private static final long METER_SAVE_MS = 15_000L;
    private static final long LIVE_TRIP_CACHE_MS = 10_000L;
    // Fixes go to loc_change (300 m track points, location log, ETA) at today's rate, even when
    // the GPS runs faster while driving.
    private static final long FORWARD_INTERVAL_MS = 4_500L;

    // GPS rate on a live trip, OG Trip Tracker's own profile: a fix every second from 15 km/h,
    // every 2 s from walking pace (so slow hill roads and hairpins keep their shape), today's
    // 5-second rate when stopped or off trip. Up immediately; down only after holding a while.
    private static final int RATE_IDLE = 0;      // 5 s, 10 m filter (today's rate)
    private static final int RATE_CRUISE = 1;    // 2 s, no distance filter
    private static final int RATE_DRIVE = 2;     // 1 s, no distance filter
    private int gpsRate = RATE_IDLE;
    private int pendingLowerRate = -1;
    private long lowerSinceMs = 0L;
    private static final float DRIVE_SPEED_MPS = 4.2f;    // 15 km/h
    private static final float CRUISE_SPEED_MPS = 0.5f;   // walking pace
    private static final long SLOWER_HOLD_MS = 30_000L;
    private static final long IDLE_HOLD_MS = 60_000L;

    // Call while driving: the speed must stay over the limit this long on trusted fixes.
    private static final long CALL_SUSTAIN_MS = 10_000L;
    private static final long CALL_GAP_MS = 10_000L;
    private long callOverSinceMs = 0L;
    private long callLastTrustedMs = 0L;
    private float callSpeedLimitKmh = 15f;
    private long callLimitLoadedMs = 0L;
    private boolean callHandsFree = false;
    private DrivingContext.Context callContext = DrivingContext.Context.UNKNOWN;

    private Location lastAcceptedLocation = null;
    private static Location lastvalidfortripend = null;
    @SuppressLint("InvalidWakeLockTag")
    synchronized private static PowerManager.WakeLock getLock(Context context) {
        if (lockStatic == null) {
            PowerManager mgr = (PowerManager) context.getApplicationContext()
                    .getSystemService(Context.POWER_SERVICE);

            if (mgr != null) {
                lockStatic = mgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
                        LOCK_NAME_STATIC);
            }
            lockStatic.setReferenceCounted(true);
        }

        return (lockStatic);
    }

    /**
     * No-op implementation as required by superclass
     */
    @Override
    public IBinder onBind(Intent i) {
        return (null);
    }

    @SuppressLint("WrongConstant")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);
        lock = getLock(this.getApplicationContext());
        database = sqlitewraper.getDatabase();
        Log.d("NITNEWFUSED", "onstartcommand");
        pref = sqlitewraper.getSecureShared("MyPref");

        //new service updatemilli
        checkServicemilli();
        startServUpdateTask();
        registerCallListener();
        if (featureLogger == null) {
            featureLogger = new MotionFeatureLogger(getApplicationContext(), database);
            featureLogger.setTerrain(terrain);
        }
        boolean isuploadlastentry = pref.getBoolean("isuploadlastentry",false);
//        check location and upload in server
        if(!isuploadlastentry) {
            //new service updatemilli

            start_alaramManager();
        }

        sharedPreferences = sqlitewraper.getSecureShared("pre1");
        lat_check = pref.getString("lat_status_flag", "k2");

        if (!lock.isHeld() || (flags & START_FLAG_REDELIVERY) != 0) {
            lock.acquire();
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Easyform";// The user-visible name of the channel.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            mChannel = new NotificationChannel(CHANNEL_ID, name, importance);

        }

        insert("new_fused_start");
        Notification notification = new NotificationCompat.Builder(sqlitewraper.context)
                .setSmallIcon(R.drawable.atc_logo)
                .setContentTitle(DeviceEventsUtils.getPackagename().get(0))
                .setContentText(DeviceEventsUtils.getPackagename().get(2))
                .setAutoCancel(false)
                .setChannelId(CHANNEL_ID)
                .setOngoing(true)
                .build();

        NotificationManager notificationCompatManager =
                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notificationCompatManager.createNotificationChannel(mChannel);
        }
        startForeground(1025, notification);

        LocationManager locationManager = (LocationManager) this
                .getSystemService(Context.LOCATION_SERVICE);
        ConnectivityManager conMgr = (ConnectivityManager) sqlitewraper.context
                .getSystemService(Context.CONNECTIVITY_SERVICE);

        if ((!(sqlitewraper.internetflag == 1))
                && (!(conMgr.getNetworkInfo(0).getState() == NetworkInfo.State.CONNECTED || conMgr
                .getNetworkInfo(1).getState() == NetworkInfo.State.CONNECTING))
                && (!locationManager
                .isProviderEnabled(LocationManager.GPS_PROVIDER))

        ) {
            getLocation();
        } else {
            getLocation();
        }

        return (START_STICKY);
    }

    //create and start the location update
    public void getLocation() {
        try {
//
//                mGoogleApiClient = new GoogleApiClient.Builder(
//                        sqlitewraper.context).addApi(LocationServices.API)
//
//

            //New Location Method

            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
            locationRequest = createLocationRequestNew();
            onLocationChanged();
            startLocationUpdates();

        } catch (Exception e) {
            Log.d("NEWFUSED", e.getMessage());
        }

    }

    private void stopLocationUpdates() {
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
        }
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(newfused.this);
            } catch (Exception e) {
                Log.e("NEW_FUSED", "Error removing GPS updates", e);
            }
        }
    }

    public boolean isMockAvailable(Location location) {

        boolean mock = false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
            mock = location.isFromMockProvider();
        } else {
            mock = !Settings.Secure.getString(getApplicationContext().getContentResolver(), "mock_location").equals("0");
        }

        if (mock) {

            new Handler(Looper.getMainLooper()).post(new Runnable() {
                public void run() {
                    if (!B_new.isIsInBackgeound()) {
                        mockalert++;
                    }
                }
            });
        } else {

            new Handler(Looper.getMainLooper()).post(new Runnable() {
                public void run() {
                    mockalert = 0;
                }
            });
        }
        return mock;
    }

    void quite() {
        if (lock != null && lock.isHeld()) {
            lock.release();
        }
    }

    @Override
    public void onDestroy() {
        // TODO Auto-generated method stub
        super.onDestroy();
        insert("new_fused_stop");
        stopLocationUpdates();
        if (timer != null) {
            timer.cancel();
        }
        saveTripDistance();
        SpeedViolation.flushPending();
        SiteIndex.saveSegment(database, liveTid, timeline.close(System.currentTimeMillis()));
        if (featureLogger != null) {
            featureLogger.stop();
            featureLogger = null;
        }
        quite();
        unregisterphonestate();
    }

    void insert(String type) {

        database = sqlitewraper.getDatabase();
        ContentValues t_i1 = new ContentValues();
        t_i1.put("f_name", type);
        t_i1.put("f_data", System.currentTimeMillis());
        long task_c = database.insert("upload_file_clone", null, t_i1);
        if (task_c > 0) {

        }
    }

    // Location callback used by the single active Fused Location pipeline.
    public void onLocationChanged() {
        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }

                for (Location location : locationResult.getLocations()) {
                    processLocation(location);
                }
            }

            @Override
            public void onLocationAvailability(LocationAvailability availability) {
                if (availability != null) tickTimeline(availability.isLocationAvailable());
            }
        };
    }

    /**
     * Single location processing pipeline (trip engine ported from OG Trip Tracker):
     * raw fix -> mock and sanity checks -> trusted-fix checks -> position smoothing
     * -> distance meter, speed violation and call checks (trusted fixes only)
     * -> loc_change at today's rate for track points, the location log and ETA.
     */
    void processLocation(Location location) {
        if (location == null) {
            return;
        }

        try {
            boolean isMock = isMockAvailable(location);
            boolean mockLocationEnabled =
                    TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true");

            if (!mockLocationEnabled && isMock) {
                Log.d("LOCATION_FILTER", "Rejected mock location");
                return;
            }

            Fix fix = Fix.from(location);
            String tid = liveTripTid();
            // Before the duplicate filter below, which drops most fixes while stopped.
            updateSamplingProfile(fix, tid != null);

            if (isBadTripLocation(location)) {
                return;
            }

            FixValidator.Reason quality = FixValidator.validate(fix, lastTrustedFix);
            boolean trusted = quality == FixValidator.Reason.OK;
            if (quality == FixValidator.Reason.IMPOSSIBLE_SPEED) {
                Log.d("LOCATION_FILTER", "Rejected impossible speed " + fix.speedMps);
                return;
            }

            // Speed: the GPS's own Doppler reading. Distance over time is only a fallback for
            // providers that report no speed.
            float speedMps;
            if (fix.hasSpeed()) {
                speedMps = fix.speedMps;
            } else {
                float manualSpeed = SpeedCalculation.calculateSpeedBetweenPoints(location);
                if (manualSpeed == 10000) {
                    return;
                }
                speedMps = manualSpeed;
                trusted = false;
            }

            if (!Float.isNaN(fix.bearingDeg) && speedMps >= 2f) {
                lastBearingDeg = fix.bearingDeg;
            }
            long nowMs = System.currentTimeMillis();
            if (lastEstimatorFixMs > 0L) {
                positionEstimator.predict(speedMps, lastBearingDeg, (nowMs - lastEstimatorFixMs) / 1000f);
            }
            PositionEstimator.Result placed = positionEstimator.correct(
                    fix.lat, fix.lng, fix.accuracyM, speedMps, nowMs);
            lastEstimatorFixMs = nowMs;
            if (placed == PositionEstimator.Result.REJECTED_OUTLIER) {
                trusted = false;
            }

            Location filteredLocation = new Location(location);
            if (positionEstimator.isReady()) {
                filteredLocation.setLatitude(positionEstimator.latitude());
                filteredLocation.setLongitude(positionEstimator.longitude());
            }
            filteredLocation.setSpeed(speedMps);

            // Under trees or in deep valleys most fixes miss the 15 m bar, and skipping them all
            // turns hill curves into straight lines. When no trusted fix has come for a while,
            // a fix up to DEGRADED_MAX_ACC_M that passes every other check counts for distance
            // (never for violations), and is reported as such.
            boolean degraded = false;
            if (!trusted && quality == FixValidator.Reason.ACCURACY && fix.hasSpeed()
                    && fix.accuracyM <= DEGRADED_MAX_ACC_M && nowMs - lastTrustedMs >= DEGRADED_AFTER_MS
                    && placed != PositionEstimator.Result.REJECTED_OUTLIER) {
                Fix relaxed = new Fix(fix.lat, fix.lng, 10f, fix.speedMps, fix.bearingDeg, fix.timeMs, fix.ageMs, fix.satellites, Double.NaN);
                degraded = FixValidator.validate(relaxed, lastTrustedFix) == FixValidator.Reason.OK;
            }

            if (trusted) {
                lastTrustedFix = fix;
                lastTrustedMs = nowMs;
                DrivingContext.onSpeed(speedMps * 3.6, nowMs);
            }
            lastAcceptedLocation = new Location(filteredLocation);
            lastvalidfortripend = new Location(filteredLocation); // use for trip end time
            latestLocation = new Location(filteredLocation);

            double addedMeters = 0;
            boolean turnPoint = false;
            if (tid != null) {
                addedMeters = measureTripDistance(tid, filteredLocation, fix, trusted, degraded);
                turnPoint = isTurnPoint(filteredLocation, fix, speedMps, trusted || degraded);
                if (trusted) {
                    SpeedViolation.onSpeedViolationOccured(speedMps,
                            filteredLocation.getLatitude(), filteredLocation.getLongitude(),
                            filteredLocation.getProvider() == null ? "fused" : filteredLocation.getProvider(),
                            fix.accuracyM, String.valueOf(speedMps));
                }
            } else if (meterTid != null) {
                // The trip just ended: save its distance and record any speeding episode still open.
                saveTripDistance();
                SpeedViolation.flushPending();
                meterTid = null;
            }
            checkCallTimeSpeed(speedMps, trusted);
            updateTimeline(nowMs, filteredLocation, fix, speedMps, addedMeters, tid);
            terrain.add(fix, speedMps * 3.6, trusted);
            if (featureLogger != null) {
                featureLogger.onFix(tid, vehicleType, trusted ? speedMps * 3.6 : -1, fix.bearingDeg, nowMs,
                        timeline.state());
            }

            long nowElapsed = SystemClock.elapsedRealtime();
            if (turnPoint || lastForwardElapsedMs == 0L || nowElapsed - lastForwardElapsedMs >= FORWARD_INTERVAL_MS) {
                lastForwardElapsedMs = nowElapsed;
                onLocationUpdate(filteredLocation, speedMps, turnPoint);
            }

        } catch (Exception e) {
            Log.e("LOCATION_FILTER", "Location processing error", e);
        }
    }

    /** The live trip's tid, or null when no trip is running. Reused for a few seconds. */
    private String liveTripTid() {
        long now = System.currentTimeMillis();
        if (now - liveTidCheckedMs < LIVE_TRIP_CACHE_MS) {
            return liveTid;
        }
        liveTidCheckedMs = now;
        Cursor c = null;
        try {
            database = sqlitewraper.getDatabase();
            c = database.rawQuery("select tid from lat_plug where trip_status = 0 order by _id desc limit 1", null);
            liveTid = c.moveToFirst() ? c.getString(0) : null;
            if (pref != null) vehicleType = pref.getString("vehicle_type", "Private-2W");
        } catch (Exception e) {
            Log.e("TRIP_ENGINE", "live trip lookup failed", e);
        } finally {
            if (c != null) c.close();
        }
        return liveTid;
    }

    /** Adds this fix to the live trip's distance and saves the total every few seconds. */
    private double measureTripDistance(String tid, Location filtered, Fix fix, boolean trusted, boolean degraded) {
        if (!tid.equals(meterTid)) {
            saveTripDistance();
            meterTid = tid;
            distanceMeter.reset();
            double[] saved = TripEngineStore.load(sqlitewraper.getDatabase(), tid);
            distanceMeter.resume(saved[0]);
            degradedMeters = saved[1];
            meterSavedMs = System.currentTimeMillis();
        }
        double added = distanceMeter.add(filtered.getLatitude(), filtered.getLongitude(), fix.accuracyM, fix.timeMs,
                trusted || degraded);
        if (degraded) degradedMeters += added;
        if (System.currentTimeMillis() - meterSavedMs >= METER_SAVE_MS) {
            saveTripDistance();
        }
        return added;
    }

    /**
     * A bend worth keeping as a track point: the heading has turned TURN_POINT_DEG since the
     * last one and the vehicle has moved at least TURN_POINT_MIN_M. Track points are otherwise
     * kept every 300 m, which draws hill curves as straight lines.
     */
    private boolean isTurnPoint(Location filtered, Fix fix, float speedMps, boolean usable) {
        if (!usable || speedMps < 2f || Float.isNaN(fix.bearingDeg)) return false;
        if (turnAnchor == null) {
            turnAnchor = new Location(filtered);
            turnAnchorBearing = fix.bearingDeg;
            return false;
        }
        float d = turnAnchor.distanceTo(filtered);
        if (d >= TURN_POINT_MIN_M && FixValidator.headingDelta(turnAnchorBearing, fix.bearingDeg) >= TURN_POINT_DEG) {
            turnAnchor = new Location(filtered);
            turnAnchorBearing = fix.bearingDeg;
            return true;
        }
        if (d >= TURN_ANCHOR_REFRESH_M) {
            // Follow gentle curves so only real bends count.
            turnAnchor = new Location(filtered);
            turnAnchorBearing = fix.bearingDeg;
        }
        return false;
    }

    /** Feeds the motion timeline and saves each finished segment. */
    private void updateTimeline(long nowMs, Location filtered, Fix fix, float speedMps, double addedMeters, String tid) {
        try {
            boolean usable = fix.accuracyM > 0 && fix.accuracyM <= 50f;
            String site = fix.accuracyM > 0 && fix.accuracyM <= 100f
                    ? siteIndex.siteAt(database, filtered.getLatitude(), filtered.getLongitude(), fix.accuracyM, nowMs)
                    : null;
            MotionTimeline.Segment done = timeline.onFix(nowMs, usable ? speedMps * 3.6 : -1, site,
                    DrivingContext.currentActivity(nowMs), addedMeters);
            if (done != null) SiteIndex.saveSegment(database, tid, done);
        } catch (Exception e) {
            Log.e("TRIP_ENGINE", "timeline failed", e);
        }
    }

    /** Time passing with no fix (parked), and Android's location on/off reports. */
    private void tickTimeline(final Boolean locationAvailable) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override public void run() {
                try {
                    long now = System.currentTimeMillis();
                    MotionTimeline.Segment done = locationAvailable == null ? timeline.tick(now)
                            : timeline.onAvailability(now, locationAvailable);
                    if (done != null) SiteIndex.saveSegment(database, liveTid, done);
                } catch (Exception e) {
                    Log.e("TRIP_ENGINE", "timeline tick failed", e);
                }
            }
        });
    }

    private void saveTripDistance() {
        if (meterTid == null) return;
        TripEngineStore.saveDistance(sqlitewraper.getDatabase(), meterTid,
                distanceMeter.totalMeters(), distanceMeter.gaps(), degradedMeters);
        meterSavedMs = System.currentTimeMillis();
    }

    /**
     * Picks the GPS rate for a live trip from the latest fix (see RATE_*). A call on a live trip
     * always gets the 1-second rate so its speed is known quickly.
     */
    private void updateSamplingProfile(Fix fix, boolean tripLive) {
        boolean callActive = simCallActive;
        boolean usable = fix.accuracyM > 0f && fix.accuracyM <= 50f && fix.hasSpeed();
        int target;
        if (!tripLive) {
            target = RATE_IDLE;
        } else if (callActive) {
            target = RATE_DRIVE;
        } else if (!usable) {
            return;   // no trustworthy speed: keep the current rate
        } else if (fix.speedMps >= DRIVE_SPEED_MPS) {
            target = RATE_DRIVE;
        } else if (fix.speedMps >= CRUISE_SPEED_MPS) {
            target = RATE_CRUISE;
        } else {
            target = RATE_IDLE;
        }

        if (target >= gpsRate || !tripLive) {
            pendingLowerRate = -1;
            lowerSinceMs = 0L;
            if (target != gpsRate) setGpsRate(target);
            return;
        }
        // Lower than now: wait until the slower speed has held, then step down to the fastest
        // rate seen while waiting.
        long now = System.currentTimeMillis();
        if (lowerSinceMs == 0L) lowerSinceMs = now;
        pendingLowerRate = Math.max(pendingLowerRate, target);
        long hold = pendingLowerRate == RATE_IDLE ? IDLE_HOLD_MS : SLOWER_HOLD_MS;
        if (now - lowerSinceMs >= hold) {
            int next = pendingLowerRate;
            pendingLowerRate = -1;
            lowerSinceMs = 0L;
            setGpsRate(next);
        }
    }

    private void setGpsRate(int rate) {
        gpsRate = rate;
        Log.d("TRIP_ENGINE", "GPS rate " + (rate == RATE_DRIVE ? "1 s" : rate == RATE_CRUISE ? "2 s" : "5 s"));
        restartLocationUpdates();
    }

    private void restartLocationUpdates() {
        if (fusedLocationClient == null || locationCallback == null) return;
        try {
            fusedLocationClient.removeLocationUpdates(locationCallback);
            locationRequest = gpsRate == RATE_DRIVE ? createDrivingLocationRequest()
                    : gpsRate == RATE_CRUISE ? createCruiseLocationRequest()
                    : createLocationRequestNew();
            startLocationUpdates();
        } catch (Exception e) {
            Log.e("TRIP_ENGINE", "GPS rate change failed", e);
        }
    }

    private boolean isBadTripLocation(Location location) {

        if (location == null) {
            return true;
        }

        double lat = location.getLatitude();
        double lng = location.getLongitude();

        // ---------------------------------------------
        // Invalid latitude / longitude
        // ---------------------------------------------

        if (lat == 0.0 || lng == 0.0 || lat < -90.0 || lat > 90.0 || lng < -180.0 ||
                lng > 180.0) {
            Log.d(
                    "LOCATION_FILTER",
                    "Reject invalid lat/lng"
            );

            return true;
        }

        // First location is OK
        if (lastAcceptedLocation == null) {
            return false;
        }

        long currentTime = location.getTime();

        long previousTime = lastAcceptedLocation.getTime();

        if (currentTime <= previousTime) {
            return true;
        }

        long timeDiff = currentTime - previousTime;

        if (timeDiff <= 0) {
            return true;
        }

        float[] distance =
                new float[1];

        Location.distanceBetween(
                lastAcceptedLocation.getLatitude(),
                lastAcceptedLocation.getLongitude(),
                lat,
                lng,
                distance
        );

        float distanceMeters =
                distance[0];

        if (distanceMeters < 3f) {

            Log.d("LOCATION_FILTER",
                    "Reject duplicate location: " +
                            distanceMeters +
                            " m"
            );

            return true;
        }

        return false;
    }

    public static Location getLatestValidLocation() {

        if (lastvalidfortripend == null) {
            return null;
        }

        return new Location(lastvalidfortripend);
    }

    LocationManager locationManager;

    @SuppressLint("MissingPermission")
    private void startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(
                this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(
                        this, Manifest.permission.ACCESS_COARSE_LOCATION)
                        != PackageManager.PERMISSION_GRANTED) {
            Log.e("LOCATION", "Location permission not granted");
            return;
        }

        if (fusedLocationClient == null || locationCallback == null) {
            Log.e("LOCATION", "Fused location client/callback is null");
            return;
        }

        fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
        );

        Log.d("LOCATION", "Fused location updates started");
    }

    protected LocationRequest createLocationRequestNew() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(5000);
        locationRequest.setFastestInterval(2000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(10);

        return locationRequest;
    }

    /** Slow movement on a live trip: a fix every 2 seconds with no distance filter (OG's cruise rate). */
    protected LocationRequest createCruiseLocationRequest() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(2000);
        locationRequest.setFastestInterval(1500);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(0);

        return locationRequest;
    }

    /** Driving on a live trip: a fix every second with no distance filter (OG's own profile). */
    protected LocationRequest createDrivingLocationRequest() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(1000);
        locationRequest.setFastestInterval(1000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(0);

        return locationRequest;
    }

    /**
     * Call while driving. A call only counts once the speed has stayed over the call speed limit
     * for CALL_SUSTAIN_MS on trusted fixes, so one GPS spike can't flag a call.
     */
    private void checkCallTimeSpeed(float speedMps, boolean trusted)
    {
        if (!simCallActive) {
            return;
        }
        if (!trusted) {
            return;
        }
        long now = System.currentTimeMillis();
        if (callLastTrustedMs > 0L && now - callLastTrustedMs > CALL_GAP_MS) {
            callOverSinceMs = 0L;   // a gap in GPS breaks the run
        }
        callLastTrustedMs = now;

        float ac_speed = speedMps * 3.6f;
        if (ac_speed > callSpeedLimit()) {
            if (callOverSinceMs == 0L) callOverSinceMs = now;
            if (!speedViolation && now - callOverSinceMs >= CALL_SUSTAIN_MS) {
                Log.d("CALL", "speedViolation ");
                speedViolation = true;
                callHandsFree = isHandsFreeCall();
                callContext = DrivingContext.current(liveTripTid() != null,
                        pref.getString("vehicle_type", "Private-2W"), now);
            }
        } else {
            callOverSinceMs = 0L;
        }
        if (speedMps > maxSpeedDuringCall) {
            maxSpeedDuringCall = speedMps;
            maxSpeedMilli = now;
        }
    }

    /** The vehicle type's call speed limit in km/h (15 when none is set), read every few minutes. */
    private float callSpeedLimit() {
        long now = System.currentTimeMillis();
        if (now - callLimitLoadedMs < 5 * 60 * 1000L) {
            return callSpeedLimitKmh;
        }
        callLimitLoadedMs = now;
        String vehicaletype = pref.getString("vehicle_type","Private-2W");
        String call_event_speed_limit = "";
        Cursor a_t2 = null;
        try {
            a_t2 = database.rawQuery(
                    "select call_event_speed_limit from Thresold_New WHERE vehicle_type = ?", new String[]{vehicaletype});
            if (a_t2.moveToFirst()) {
                call_event_speed_limit = a_t2.getString(0);
            }
        } catch (Exception e) {
            Log.e("CALL", "call limit lookup failed", e);
        } finally {
            if (a_t2 != null) a_t2.close();
        }
        float limit = 15f;   // call speed default is 15 km/h
        try {
            if (call_event_speed_limit != null && !call_event_speed_limit.equalsIgnoreCase("")
                    && !call_event_speed_limit.equalsIgnoreCase("null") && !call_event_speed_limit.equalsIgnoreCase("0")) {
                limit = Float.parseFloat(call_event_speed_limit);
            }
        } catch (NumberFormatException ignored) {
        }
        callSpeedLimitKmh = limit;
        return limit;
    }

    private void resetCallRun() {
        callOverSinceMs = 0L;
        callLastTrustedMs = 0L;
        callHandsFree = false;
        callContext = DrivingContext.Context.UNKNOWN;
    }

    /** A call connected: start a fresh run and, on a live trip, switch to 1-second fixes now. */
    private void onCallStarted() {
        resetCallRun();
        if (gpsRate != RATE_DRIVE && liveTripTid() != null) {
            pendingLowerRate = -1;
            lowerSinceMs = 0L;
            setGpsRate(RATE_DRIVE);
        }
    }

    /**
     * True when call audio goes to a car kit, headset or the speaker. Recorded on the call event
     * so the policy can decide whether hands-free calls count.
     */
    @SuppressWarnings("deprecation")
    private boolean isHandsFreeCall() {
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am == null) return false;
            return am.isBluetoothScoOn() || am.isBluetoothA2dpOn() || am.isSpeakerphoneOn() || am.isWiredHeadsetOn();
        } catch (Exception e) {
            return false;
        }
    }
    private void onLocationUpdate(Location location, float manualSpeed, boolean turnPoint) {

        data d = new data();

        double lat1 = location.getLatitude();
        double lon1 = location.getLongitude();

        Log.d("NITNEWFUSED", String.valueOf(lat1));

        boolean mock = false;

        //avoid usage of mock location app
        if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true")) {
            mock = isMockAvailable(location);
        }

        Log.d("##MOCKALERTUPPER_LATLON", String.valueOf(mockalert) + lat1 + ":" + lon1 + " MockLocationStatusNORMAL: " + mock);

        if (mock && !TripMapUtils.MOCKLOCATION.equalsIgnoreCase("true")) {
            Log.d("##MOCKALERTUPPER_NORMAL", String.valueOf(mockalert) + lat1 + ":" + lon1);

            //Brodcast to show alert dialog of fake location in ph_s.java
            Intent intent = new Intent("fake-location");
            LocalBroadcastManager.getInstance(sqlitewraper.context).sendBroadcast(intent);
            return;
        }

        Double lat = location.getLatitude();
        Double lon = location.getLongitude();
        float sd = (float) location.getAltitude();

        // Gps Speed set //
        String gps_speed = String.valueOf(location.getSpeed());

        //if manual speed is accurate than use manual speed instead of location provided speed
        if (manualSpeed != 10000) {
            location.setSpeed(manualSpeed);
            Log.d("##MY_SPEED_MANUAL :", String.valueOf(manualSpeed));
        }

        //----- For Testing Purpose---------------//
        float ac_speed = location.getSpeed();
        float fact = (float) ((float) 18 / 5);
        ac_speed = ac_speed * fact;

        //-------------Location insert----------------//
        String timemilli = String.valueOf(System.currentTimeMillis());

        Intent loc_change = new Intent(sqlitewraper.context, loc_change.class);

        //  when mock location provider true, trip flag added 1 because fused location pot map not draw properly 07-04-2025
        loc_change.putExtra("tripflag", "2");
        loc_change.putExtra("loc", location);
        loc_change.putExtra("address", "");
        loc_change.putExtra("speed", location.getSpeed());
        loc_change.putExtra("time", timemilli);
        loc_change.putExtra("gps_speed",gps_speed);
        // A bend on a live trip: kept as a track point even when closer than 300 m.
        loc_change.putExtra("turnpoint", turnPoint);

        // Fixes above 118 km/h used to be dropped here, so highway speeding left no trace.
        // FixValidator now rejects only impossible speeds (above about 270 km/h).
        WakefulIntentService.sendWakefulWork(sqlitewraper.context, loc_change);

        Intent i = new Intent();
        i.setAction("Location");
        i.putExtra("lat", lat);
        i.putExtra("lon", lon);
        i.putExtra("accuracy", location.getAccuracy());
        i.putExtra("speed", location.getSpeed());
        i.putExtra("gps_speed",gps_speed);
        if (lat_check.equalsIgnoreCase("2")) {
            sqlitewraper.context.sendBroadcast(i);
        }

        pref.putString("lat_status_flag", "1");
        pref.putString("lat", String.valueOf(lat));
        pref.putLong("lat_status_out", System.currentTimeMillis());
        pref.putString("lon", String.valueOf(lon));
        pref.putString("accuracy", String.valueOf(location.getAccuracy()));
        pref.commit();

    }

    @Override
    public void onLocationChanged(@NonNull Location location) {
        // Kept for LocationListener compatibility. The service now uses the
        // Fused Location Provider as the single active location source.
        // If a GPS_PROVIDER callback is delivered by legacy code, process it
        // through the same single pipeline instead of duplicating logic.
        processLocation(location);
    }

    @Override
    public void onProviderDisabled(String provider) {
    }

    @Override
    public void onProviderEnabled(String provider) {
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
        Log.d("checkIsFakeLocation sChanged: ", provider + " " + status + "" + extras.toString());

    }

    public void start_alaramManager()
    {
        AlarmManager alarmManager = (AlarmManager)sqlitewraper.context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pendingIntent;
        Intent intent = new Intent(sqlitewraper.context, newfused_recevier.class);
        int flags = PendingIntent.FLAG_CANCEL_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags = PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_MUTABLE;
        }
        pendingIntent = PendingIntent.getBroadcast(sqlitewraper.context, 0, intent, flags);

        MySharedPreferences pref = sqlitewraper.getSecureShared("MyPref");
        pref.putBoolean("isuploadlastentry", true); // Saving string
        pref.commit();
        long intervalMillis = 10 * 60 * 1000; // 10 minutes
        long triggerTime = System.currentTimeMillis() + intervalMillis;

        alarmManager.setInexactRepeating(AlarmManager.RTC_WAKEUP, triggerTime, intervalMillis,pendingIntent);
    }

    private void updateServiceMilli() {

        pref = sqlitewraper.getSecureShared("MyPref");
        pref.putString("SERVICEUPDATE", String.valueOf(System.currentTimeMillis())); // Saving string
        pref.commit();
    }

    //to check if service is not running for specific period of time if trip is running
    private void checkServicemilli() {

        try{

            database = sqlitewraper.getDatabase();

            pref = sqlitewraper.getSecureShared("MyPref");
            String serviceupdate = pref.getString("SERVICEUPDATE", null);

            if (serviceupdate != null) {

                Log.d("####new_fused", "checkServicesmilli");
                Cursor tripflag = database.rawQuery(
                        "select * from lat_plug where trip_status = 0", null);
                tripflag.moveToFirst();
                int tripflagCount = tripflag.getCount();
                tripflag.close();

                if (tripflagCount > 0) {

                    if (!serviceupdate.equalsIgnoreCase("0")) {

                        long servicestart = System.currentTimeMillis();
                        long stopduration = servicestart - Long.valueOf(serviceupdate);

                        DataUtils.setServiceMilli(servicestart);

                        if (stopduration > 120000) {

                            boolean isInserted = DeviceEventsUtils.insertIntoEvents(serviceupdate, String.valueOf(servicestart), String.valueOf(stopduration), "Service_outage");
                            if (isInserted) {

                                pref = sqlitewraper.getSecureShared("MyPref");
                                pref.putString("SERVICEInsert","1");
                                pref.putString("SERVICEUPDATE", "0"); // Saving string
                                pref.commit();
                            }
                        }
                    }

                    //to check if trip service is running or not
                    Intent Autotripservice = new Intent(sqlitewraper.context,
                            AutoTripStopService.class);
                    WakefulIntentService.sendWakefulWork(sqlitewraper.context,
                            Autotripservice);
                }
            }
        }catch (Exception e){

            pref = sqlitewraper.getSecureShared("MyPref");
            pref.putString("SERVICEUPDATE", "0"); // Saving string
            pref.commit();
        }
    }

    //timer for every 30 seconds to check if service is running or not
    private void startServUpdateTask() {

        if(timer != null) {
            timer.cancel();
        }
        timer = new Timer();
        final int counter = 0;

        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                Log.d("NITNEWFUSED_GPS", String.valueOf(counter));
                checkServicemilli();
                updateServiceMilli();
                tickTimeline(null);
            }
        }, DELAY, DELAY);
    }

    @SuppressLint("MissingPermission")
    private void registerCallListener() {

        if (isCallListenerRegistered) {
            Log.d("CALL", "Listener already registered");
            return;
        }

        telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);

        if (telephonyManager == null)
            return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

            telephonyCallback = new MyTelephonyCallback();

            telephonyManager.registerTelephonyCallback(getMainExecutor(), telephonyCallback);

        } else {

            phoneStateListener =
                    new PhoneStateListener() {

                        @Override
                        public void onCallStateChanged(int state,
                                                       String phoneNumber) {

                            handleCallState(state);

                        }
                    };

            telephonyManager.listen(
                    phoneStateListener,
                    PhoneStateListener.LISTEN_CALL_STATE);

        }

        isCallListenerRegistered = true;

    }

    public  void handleCallState(int state) {
        Log.e("CALL_DEBUG", "State = " + state);
        if (state == lastCallState) {
            return;
        }

        lastCallState = state;

        if (!(DeviceEventsUtils.liveTripCount() > 0))
            return;

        switch (state) {

            case TelephonyManager.CALL_STATE_RINGING:

                Log.d("CALL", "Incoming Call");

                break;

            case TelephonyManager.CALL_STATE_OFFHOOK:

                if (!simCallActive) {

                    simCallActive = true;

                    callStartTime = System.currentTimeMillis();
                    callEventInserted = false;
                    speedViolation = false;
                    maxSpeedDuringCall = 0f;
                    maxSpeedMilli = 0L;
                    onCallStarted();

                    if (latestLocation != null) {
                        callStartLocation = new Location(latestLocation);
                    }

                }

                break;

            case TelephonyManager.CALL_STATE_IDLE:

                if (simCallActive) {

                    simCallActive = false;

                    callEndTime = System.currentTimeMillis();

                    if (latestLocation != null) {
                        callEndLocation = new Location(latestLocation);

                    }
                    if (speedViolation && !callEventInserted)
                    {
                        long duration = (callEndTime - callStartTime) ;

                        callEventInserted = true;
                        if (callStartLocation != null &&
                                callEndLocation != null) {

                            float meters =
                                    callStartLocation.distanceTo(callEndLocation);
                            double  distanceKm  = meters / 1000.0;
                        }

                         calleventinsert(
                                    callStartTime,
                                    String.valueOf(callEndTime),
                                    String.valueOf(duration),
                                    callEndLocation);

//

                        resetcalldata();
                        }
                        else {

                            Log.d("CALL","No speed violation during call.");
                        }

                }

                break;
        }

    }

 private void resetcalldata()
 {
     simCallActive = false;
     speedViolation = false;

     callStartLocation = null;
     callEndLocation = null;

     callStartTime = 0;
     callEndTime = 0;

     maxSpeedDuringCall = 0;
     maxSpeedMilli = 0;
     resetCallRun();

     lastCallState = -1;
 }

    private boolean calleventinsert(long callstarttime, String callendtime, String duration,Location callEndLocation)
    {
        try{
            long currentTime = System.currentTimeMillis();
            // Only a call while driving counts; others are kept on the phone for review.
            if (!DrivingContext.counts(callContext)) {
                HeldEventStore.hold(database, "Call", callContext, DeviceEventsUtils.gettid(), callstarttime, currentTime,
                        "{\"maxSpeedDuringCall\":" + maxSpeedDuringCall + ",\"handsfree\":" + callHandsFree + "}");
                return false;
            }
            ContentValues c = new ContentValues();
            c.put("username", d.getusername());
            c.put("Event_type", "Call");
            c.put("is_send", "0");
            c.put("lat", callEndLocation.getLatitude());
            c.put("lon", callEndLocation.getLongitude());
            //New added Code
            c.put("th_s", "Call");
            c.put("battery", DeviceEventsUtils.getBatteryInfo());
            c.put("timezone", DeviceEventsUtils.getTimeZone());
            c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(callstarttime));
            c.put("utcend", DeviceEventsUtils.utcCalculationOffset(currentTime));
            c.put("imei", DeviceEventsUtils.getLoginDetails().get(1));
            c.put("appid", DeviceEventsUtils.getLoginDetails().get(2));
            c.put("userid", DeviceEventsUtils.getLoginDetails().get(0));
            c.put("Event_strt", callstarttime);
            c.put("Event_end", currentTime);
            c.put("duration", duration);

            JSONObject maxViolation = new JSONObject();
            maxViolation.put("maxSpeedDuringCall", maxSpeedDuringCall);
            maxViolation.put("maxSpeedTime", maxSpeedMilli);
            maxViolation.put("handsfree", callHandsFree);
            maxViolation.put("context", DrivingContext.label(callContext));

            c.put("maxviolation",maxViolation.toString());

            String tid = DeviceEventsUtils.gettid();

            c.put("tid",tid);

            long temp = database.insert("Events", null, c);
            if (temp > 0) {
                Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
                WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
                return true;

            }
            else {
                return false;
            }

        }
        catch (Exception e)
        {
            Log.d("Exception",e.toString());
        }
        return false;
    }

    private void unregisterphonestate()
    {
        if (telephonyManager != null) {

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {

                if (telephonyCallback != null) {
                    telephonyManager.unregisterTelephonyCallback(telephonyCallback);
                }

            } else {

                if (phoneStateListener != null) {
                    telephonyManager.listen(phoneStateListener,
                            PhoneStateListener.LISTEN_NONE);
                }
            }
        }

        isCallListenerRegistered = false;
        lastCallState = -1;
    }

    @RequiresApi(api = Build.VERSION_CODES.S)
    private  class MyTelephonyCallback
            extends TelephonyCallback
            implements TelephonyCallback.CallStateListener {

        @Override
        public void onCallStateChanged(int state) {
            Log.e("CALL_STATE", "TelephonyCallback state = " + state);
            handleCallState(state);

        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);

        try {
            boolean isTripRunning = (DeviceEventsUtils.liveTripCount() > 0);

            if (isTripRunning ) {
                scheduleServiceRestart();
            }
        } catch (Exception e) {
            Log.e("NEWFUSED", "Error in onTaskRemoved auto-restart: " + e.getMessage());
        }
    }

    private void scheduleServiceRestart() {
        Intent restartServiceIntent = new Intent(getApplicationContext(), ServiceRestarter.class);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent restartServicePendingIntent = PendingIntent.getBroadcast(
                getApplicationContext(),
                1,
                restartServiceIntent,
                flags
        );

        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            long triggerAtMillis = SystemClock.elapsedRealtime() + (15 * 60 * 1000);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        triggerAtMillis,
                        restartServicePendingIntent
                );
            } else {
                alarmManager.setExact(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        triggerAtMillis,
                        restartServicePendingIntent
                );
            }
        }
    }
}
