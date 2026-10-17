package com.sky.atc.easyformse.trip;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.location.Location;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.commonsware.cwac.wakeful.WakefulIntentService;
import com.sky.atc.easyformse.DeviceEventsUtils;
import com.sky.atc.easyformse.Event;
import com.sky.atc.easyformse.R;
import com.sky.atc.easyformse.data;
import com.sky.atc.easyformse.datautils.MySharedPreferences;
import com.sky.atc.easyformse.sqlitewraper;
import com.sky.atc.easyformse.trip.engine.DrivingContext;
import com.sky.atc.easyformse.trip.engine.HeldEventStore;
import com.sky.atc.easyformse.trip.engine.OverspeedEpisodes;

import net.sqlcipher.database.SQLiteDatabase;

import org.json.JSONObject;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;
import com.sky.atc.easyformse.utils.LogUtils;

//Speed violation calculation
@StringFogIgnore
public class SpeedViolation {


    public static long getSpeedVioDur() {
        return speedVioDur;
    }

    public static void setSpeedVioDur(long speedVioDur) {
        SpeedViolation.speedVioDur = speedVioDur;
    }

    private static long speedVioDur;
    private static MySharedPreferences sharedPreferences;

    private static data d = new data();
    private static SQLiteDatabase database = sqlitewraper.getDatabase();
    // Episode rules (margin, end after 5 s below, merging, minimum duration) live here.
    private static final OverspeedEpisodes episodes = new OverspeedEpisodes();
    private static double episodeStartLat, episodeStartLon, lastLat, lastLon;
    private static float episodeLimitKmh;
    private static String episodeTid = "0";
    private static DrivingContext.Context episodeContext = DrivingContext.Context.UNKNOWN;
    static MySharedPreferences pref;

    /**
     * Called by the trip engine (newfused) on every trusted fix of a live trip, about once a
     * second while driving. Records at most one over-speed event per episode; see
     * {@link OverspeedEpisodes} for when an episode starts, ends and counts.
     */
    public static void onSpeedViolationOccured(float speed, double lat, double lon, String provider, String tripflag, float acc,String timelocation,String gps_speed) {

        //convert speed to m/s to km/h
        float ac_speed = speed * 3.6f;

        pref = sqlitewraper.getSecureShared("MyPref");

        //-------------------Speed Violation-----------//
        if (d.getusername().equalsIgnoreCase("0")) {
            return;
        }
        if (tripStatus() <= 0) {
            flushPending();
            episodes.reset();
            return;
        }
        // Read from the database every few minutes, not on every fix.
        refreshThresholds();
        float limit = d.getSpeedLimit();
        long now = System.currentTimeMillis();

        switch (episodes.onFix(now, ac_speed, limit, configuredDurationMs())) {
            case STARTED:
                episodeStartLat = lat;
                episodeStartLon = lon;
                Log.d("##SPEED_DETECT", String.valueOf(ac_speed));
                LogUtils.writeAttendanceLogToFile(String.valueOf(ac_speed), "##SPEED_DETECT");
                //tripflag=3 marks the location as a speed violation point on the map
                insertIntoTrackMaster(lat, lon, provider, speed, now, String.valueOf(acc), gps_speed);
                break;
            case ONGOING:
                // One map point every few seconds is enough to draw the red stretch; one per
                // second sent about 2,200 points on a 95-minute ride.
                if (ac_speed > limit && now - lastViolationPointMs >= VIOLATION_POINT_EVERY_MS) {
                    insertIntoTrackMaster(lat, lon, provider, speed, now, String.valueOf(acc), gps_speed);
                }
                break;
            case EVENT:
                // Qualified: alert now. The event is recorded when the episode is over, so it
                // carries the real end, duration and top speed.
                insertIntoTrackMaster(lat, lon, provider, speed, now, String.valueOf(acc), gps_speed);
                episodeContext = DrivingContext.current(true, pref.getString("vehicle_type", "Private-2W"), now);
                episodeLimitKmh = limit;
                episodeTid = gettid();
                if (DrivingContext.counts(episodeContext)) {
                    new Handler(Looper.getMainLooper()).post(SpeedViolation::speedViolationAlert);
                }
                break;
            case FINISHED:
                recordEvent(lastLat, lastLon);
                break;
            default:
                break;
        }
        if (episodes.inEpisode()) {
            lastLat = lat;
            lastLon = lon;
        }
    }

    /**
     * Records a qualified episode that hasn't been recorded yet, e.g. when the trip ends or the
     * tracking service stops.
     */
    public static void flushPending() {
        try {
            if (episodes.flush()) {
                if (pref == null) pref = sqlitewraper.getSecureShared("MyPref");
                recordEvent(lastLat, lastLon);
            }
        } catch (Exception e) {
            Log.e("SPEED", "flush failed", e);
        }
    }

    /** speed_violation_time for the vehicle type, in ms (2 minutes when unset). */
    private static long configuredDurationMs() {
        String speedDuration = sqlitewraper.getSecureShared("pre1").getString("speedviolation", "120000");
        try {
            if (speedDuration != null && !speedDuration.trim().isEmpty()) {
                return Long.parseLong(speedDuration.trim());
            }
        } catch (NumberFormatException ignored) {
        }
        return 120000L;
    }

    /**
     * One Events row for a finished episode: where and when the speeding started, when it ended,
     * how long it lasted, the time spent over the limit and the top speed. Uploaded for the server.
     */
    private static void recordEvent(double endLat, double endLon) {
        try {
            long start = episodes.startMs();
            long end = Math.max(episodes.endMs(), start);
            DrivingContext.Context context = episodeContext;
            // Only speeding while driving counts (a declared passenger, for example, doesn't).
            if (!DrivingContext.counts(context)) {
                HeldEventStore.hold(database, "speed", context, episodeTid, start, end,
                        "{\"maxspeed\":" + (episodes.maxKmh() / 3.6) + "}");
                return;
            }
            ContentValues c = new ContentValues();
            c.put("username", d.getusername());
            c.put("Event_type", "speed");
            c.put("is_send", "0");
            c.put("lat", episodeStartLat);
            c.put("lon", episodeStartLon);
            c.put("th_s", "Still");
            c.put("battery", DeviceEventsUtils.getBatteryInfo());
            c.put("timezone", DeviceEventsUtils.getTimeZone());
            c.put("utcstart", DeviceEventsUtils.utcCalculationOffset(start));
            c.put("utcend", DeviceEventsUtils.utcCalculationOffset(end));
            c.put("imei", DeviceEventsUtils.getLoginDetails().get(1));
            c.put("appid", DeviceEventsUtils.getLoginDetails().get(2));
            c.put("userid", DeviceEventsUtils.getLoginDetails().get(0));
            c.put("Event_strt", start);
            c.put("Event_end", end);
            c.put("duration", end - start);

            JSONObject maxViolation = new JSONObject();
            // m/s, as before
            maxViolation.put("maxspeed", episodes.maxKmh() / 3.6);
            maxViolation.put("maxspeedmilli", episodes.maxMs());
            maxViolation.put("over_limit_ms", episodes.overMs());
            maxViolation.put("limit_kmh", episodeLimitKmh);
            maxViolation.put("end_lat", endLat);
            maxViolation.put("end_lon", endLon);
            maxViolation.put("context", DrivingContext.label(context));
            c.put("maxviolation", maxViolation.toString());
            c.put("tid", episodeTid);   // the trip may have ended by now

            Log.d("##SPEED_FINALDETECT", (end - start) + " ms, max " + episodes.maxKmh());
            database.insert("Events", null, c);

            //upload the event to the server
            Intent z_n12 = new Intent(sqlitewraper.context, Event.class);
            WakefulIntentService.sendWakefulWork(sqlitewraper.context, z_n12);
        } catch (Exception e) {
            e.printStackTrace();
            LogUtils.writeAttendanceLogToFile(String.valueOf(e.getMessage()), "SPEED_EXCEPTION");
        }
    }

    private static final long THRESHOLD_REFRESH_MS = 5 * 60 * 1000L;
    private static long thresholdsLoadedMs = 0L;
    private static String thresholdsVehicleType = null;

    /**
     * Loads the vehicle type's speed limit and violation duration into preferences, at most
     * every few minutes. The harsh acceleration and braking values in the same table are no
     * longer used.
     */
    private static void refreshThresholds() {
        String vehicaletype = pref.getString("vehicle_type","Private-2W");
        long now = System.currentTimeMillis();
        if (vehicaletype.equals(thresholdsVehicleType) && now - thresholdsLoadedMs < THRESHOLD_REFRESH_MS) {
            return;
        }
        thresholdsVehicleType = vehicaletype;
        thresholdsLoadedMs = now;
        // speed violation is set per vehicle_type 11072025
        Cursor a_t2 = database.rawQuery(
                "select speed,speed_violation_time from Thresold_New WHERE vehicle_type = ?", new String[]{vehicaletype});
        try {
            if (a_t2.moveToFirst()) {
                pref.putString("speed_limit", a_t2.getString(0));
                pref.commit();
                MySharedPreferences editor = sqlitewraper.getSecureShared("pre1");
                editor.putString("speedviolation", a_t2.getString(1));
                editor.commit();
                return;
            }
        } finally {
            a_t2.close();
        }
        Cursor a_t3 = database.rawQuery("select speed from Thresold", null);
        try {
            if (a_t3.moveToFirst()) {
                pref.putString("speed_limit", a_t3.getString(0));
                pref.commit();
            }
        } finally {
            a_t3.close();
        }
    }

    private static final long TRIP_STATUS_CACHE_MS = 10_000L;
    private static long tripStatusCheckedMs = 0L;
    private static int tripStatusCount = 0;

    // Called on every trusted fix, so the answer is reused for a few seconds.
    private static int tripStatus() {
        long now = System.currentTimeMillis();
        if (now - tripStatusCheckedMs < TRIP_STATUS_CACHE_MS) {
            return tripStatusCount;
        }

        SQLiteDatabase database = sqlitewraper.getDatabase();

        Cursor tripflag = database.rawQuery(
                "select * from lat_plug where trip_status = 0", null);
        tripflag.moveToFirst();
        int tripflagCount = tripflag.getCount();
        tripflag.close();
        tripStatusCount = tripflagCount;
        tripStatusCheckedMs = now;
        return tripflagCount;
    }

    @SuppressLint("WrongConstant")
    private static void speedViolationAlert() {


        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + sqlitewraper.context.getPackageName() + "/" + R.raw.emergencytone);

        NotificationChannel channel;

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {

//            AudioAttributes attributes;
//            attributes = new AudioAttributes.Builder()
//                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
//                    .build();
            channel = new NotificationChannel("channel01", "name", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("description");
//            channel.setSound(sound, attributes);
            //  notification play custom sound
            Ringtone r = RingtoneManager.getRingtone(sqlitewraper.context, sound);
            r.play();
            NotificationManager notificationManager = sqlitewraper.context.getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }

// Register channel with system
        Notification notification = new NotificationCompat.Builder(sqlitewraper.context, "channel01")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Speed Violation")
                .setContentText("You are currently violating Speed limit policy, decrease your speed")
                .setSound(sound)
                .setPriority(NotificationCompat.PRIORITY_HIGH)   // heads-up
                .build();

        NotificationManagerCompat notificationManager1 = NotificationManagerCompat.from(sqlitewraper.context);
        if (ActivityCompat.checkSelfPermission(sqlitewraper.context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            // TODO: Consider calling
            //    ActivityCompat#requestPermissions
            // here to request the missing permissions, and then overriding
            //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
            //                                          int[] grantResults)
            // to handle the case where the user grants the permission. See the documentation
            // for ActivityCompat#requestPermissions for more details.
            return;
        }
        notificationManager1.notify(202, notification);
    }


    private static final long VIOLATION_POINT_EVERY_MS = 10_000L;
    private static long lastViolationPointMs = 0L;

    private static void insertIntoTrackMaster(double lat, double lon, String provider, float speed, long Milli, String acc,String gps_speed) {
        lastViolationPointMs = Milli;


        if (provider.equalsIgnoreCase("gps")) {
            provider = "fused";
        }
        if (provider.equalsIgnoreCase("fused")) {
            provider = "gps";
        }

        Date now = new Date();
        String date_s = now.toString();

        ContentValues args = new ContentValues();
        args.put("cellid", "NA");
        args.put("lat", DeviceEventsUtils.LatlngRoundff(String.valueOf(lat)));
        args.put("date", String.valueOf(Milli));
        args.put("date_s", date_s);
        args.put("lon", DeviceEventsUtils.LatlngRoundff(String.valueOf(lon)));
        args.put("provider", provider);
        args.put("accuracy", acc);
        args.put("IS_SEND", 0);
        args.put("IS_LOC", String.valueOf(Milli));
        args.put("address", "NA");
        args.put("username", DeviceEventsUtils.getLoginDetails().get(0));
        args.put("speed", speed);
        args.put("tripflag", "3");
        args.put("locationtime", String.valueOf(Milli));
        args.put("gps_speed",gps_speed);
        long temp = database.insert("track_master", null, args);
        Log.d("SPEED_TRACKMASTER", String.valueOf(temp));

    }

    public static String gettid(){
        Cursor tripflag = database.rawQuery("select tid from lat_plug where trip_status = 0", null);
        tripflag.moveToLast();
        int tripflagCount = tripflag.getCount();

        String tid = "0";

        if (tripflagCount>0){
            tid = tripflag.getString(0);
        }

        tripflag.close();
        return tid;
    }
}
