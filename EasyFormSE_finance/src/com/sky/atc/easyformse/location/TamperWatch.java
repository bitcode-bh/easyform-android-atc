package com.sky.atc.easyformse.location;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.location.LocationManager;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.trip.TripMapUtils;
import com.sky.atc.easyformse.trip.engine.EngineTables;

/**
 * Location tampering: fake GPS (mock fixes) and location switched off. The location service
 * listens all day, so this is seen with the app swiped away; the app's own GPS receiver also
 * reports here, so each outage is recorded once whichever of them sees it.
 *
 * An episode stays open across service restarts (in prefs) and closes when the phone is back to
 * normal. Location off becomes a Gps_outage event with its full duration; fake GPS goes on the
 * existing once-a-day fake_location upload. Both are also kept in tamper_events on the phone.
 */
@StringFogIgnore
public final class TamperWatch {

    private static final String TAG = "TAMPER";
    /** Same channel as the location service's own notification. */
    public static final String CHANNEL_ID = "my_channel_01";
    private static final String PREFS = "tamper_watch";
    private static final String KEY_GPS_OFF = "gps_off_ms";
    private static final String KEY_GPS_TID = "gps_off_tid";
    private static final String KEY_MOCK = "mock_ms";
    private static final String KEY_MOCK_TID = "mock_tid";
    private static final int NOTIFY_GPS_OFF = 1026;
    private static final int NOTIFY_MOCK = 1027;
    /** Shorter than this is a toggle by mistake, as before. */
    private static final long MIN_OUTAGE_MS = 1000;

    private static TamperWatch instance;

    private final Context context;
    private final MySharedPreferences prefs;
    private BroadcastReceiver receiver;
    // Copies of the prefs, so a fix only touches them when something changes.
    private long gpsOffSince, mockSince;
    private String gpsOffTid, mockTid;
    private boolean gpsAlertShown, mockAlertShown;

    public static synchronized TamperWatch get(Context context) {
        if (instance == null) instance = new TamperWatch(context);
        return instance;
    }

    private TamperWatch(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = sqlitewraper.getSecureShared(PREFS);
        gpsOffSince = prefs.getLong(KEY_GPS_OFF, 0);
        gpsOffTid = prefs.getString(KEY_GPS_TID, "");
        mockSince = prefs.getLong(KEY_MOCK, 0);
        mockTid = prefs.getString(KEY_MOCK_TID, "");
    }

    /** Listens for location being switched off or on, and checks the current state once. */
    public synchronized void start() {
        if (receiver != null) return;
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context c, Intent intent) {
                checkGps();
            }
        };
        IntentFilter filter = new IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION);
        filter.addAction(LocationManager.MODE_CHANGED_ACTION);
        androidx.core.content.ContextCompat.registerReceiver(context, receiver, filter, androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED);
        checkGps();
    }

    /** Stops listening and takes the alerts down; open episodes resume on the next start. */
    public synchronized void stop() {
        if (receiver != null) {
            try {
                context.unregisterReceiver(receiver);
            } catch (Exception ignored) {
                // already gone
            }
            receiver = null;
        }
        cancel(NOTIFY_GPS_OFF);
        cancel(NOTIFY_MOCK);
        gpsAlertShown = mockAlertShown = false;
    }

    /** On logout: the next user must not inherit an open episode. */
    public synchronized void clear() {
        stop();
        prefs.clear();
        gpsOffSince = mockSince = 0;
        gpsOffTid = mockTid = "";
    }

    /** Also called every 30 s by the location service, in case a broadcast is missed. */
    public synchronized void checkGps() {
        try {
            LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
            boolean on = lm != null && lm.isProviderEnabled(LocationManager.GPS_PROVIDER);
            long now = System.currentTimeMillis();
            if (!on) {
                if (gpsOffSince == 0) {
                    gpsOffSince = now;
                    gpsOffTid = liveTid();
                    prefs.putLong(KEY_GPS_OFF, now);
                    prefs.putString(KEY_GPS_TID, gpsOffTid);
                }
                if (!gpsAlertShown) {
                    gpsAlertShown = notify(NOTIFY_GPS_OFF, "Location is off",
                            "Turn location on. Trips and attendance are not being tracked.",
                            Settings.ACTION_LOCATION_SOURCE_SETTINGS);
                }
            } else if (gpsOffSince > 0) {
                long since = gpsOffSince;
                String tid = gpsOffTid;
                gpsOffSince = 0;
                prefs.putLong(KEY_GPS_OFF, 0);
                cancel(NOTIFY_GPS_OFF);
                gpsAlertShown = false;
                if (now - since >= MIN_OUTAGE_MS) {
                    // Builds that allow mock locations are for testing; they never reported outages.
                    if (TripMapUtils.MOCKLOCATION.equalsIgnoreCase("false")) {
                        DeviceEventsUtils.insertIntoEvents(String.valueOf(since), String.valueOf(now),
                                String.valueOf(now - since), "Gps_outage");
                    }
                    keep("gps_off", tid, since, now);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "gps check failed", e);
        }
    }

    /** Every fix the location service receives, before mock fixes are dropped. */
    public synchronized void onFix(boolean mock) {
        if (mock == (mockSince > 0) && (!mock || mockAlertShown)) return;   // nothing changed
        try {
            long now = System.currentTimeMillis();
            if (mock) {
                if (mockSince == 0) {
                    mockSince = now;
                    mockTid = liveTid();
                    prefs.putLong(KEY_MOCK, now);
                    prefs.putString(KEY_MOCK_TID, mockTid);
                    FakeLocationUtils.checkTodaysEntryandInsertIntoDatabse();
                }
                mockAlertShown = notify(NOTIFY_MOCK, "Fake location detected",
                        "Turn off the fake GPS app. Locations from it are not recorded.",
                        Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS);
            } else {
                long since = mockSince;
                mockSince = 0;
                prefs.putLong(KEY_MOCK, 0);
                cancel(NOTIFY_MOCK);
                mockAlertShown = false;
                keep("fake_location", mockTid, since, now);
            }
        } catch (Exception e) {
            Log.e(TAG, "mock check failed", e);
        }
    }

    private static String liveTid() {
        return DeviceEventsUtils.liveTripCount() > 0 ? DeviceEventsUtils.gettid() : "";
    }

    private static void keep(String type, String tid, long startMs, long endMs) {
        ContentValues v = new ContentValues();
        v.put("type", type);
        v.put("tid", tid);
        v.put("start_ms", startMs);
        v.put("end_ms", endMs);
        v.put("duration_ms", endMs - startMs);
        EngineTables.append(sqlitewraper.getDatabase(), "tamper_events", "CREATE TABLE IF NOT EXISTS tamper_events ("
                + "_id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, tid TEXT, start_ms INTEGER, "
                + "end_ms INTEGER, duration_ms INTEGER)", v, 2_000);
    }

    /** Posts an ongoing alert; false if it could not be shown. */
    private boolean notify(int id, String title, String text, String settingsAction) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return false;
        // The service may not have created its channel yet (first start with location off).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(CHANNEL_ID) == null) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "Easyform",
                    NotificationManager.IMPORTANCE_HIGH));
        }
        Intent open = new Intent(settingsAction).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0;
        PendingIntent tap = PendingIntent.getActivity(context, id, open, flags);
        nm.notify(id, new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.atc_logo)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(tap)
                .setOngoing(true)
                .build());
        return true;
    }

    private void cancel(int id) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(id);
    }
}
