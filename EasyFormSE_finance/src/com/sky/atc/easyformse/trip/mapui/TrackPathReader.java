package com.sky.atc.easyformse.trip.mapui;

import android.database.Cursor;

import com.google.android.gms.maps.model.LatLng;
import com.sky.atc.easyformse.sqlitewraper;

import net.sqlcipher.database.SQLiteDatabase;

import java.util.ArrayList;
import java.util.List;

// Reads the covered route the engine has already recorded. SELECT only —
// this class must never write to track_master or lat_plug (PRD §2, FR-24).
public final class TrackPathReader {

    private TrackPathReader() {
    }

    public static class TrackPoint {
        public final LatLng position;
        public final boolean violation;
        /**
         * True when this point starts a new trip in a merged day route: the line from the previous
         * point is a join between trips, not road driven, so it's drawn dashed and not counted.
         */
        public final boolean joinBefore;
        /** Recorded time (ms), or 0 when unknown. */
        public final long timeMs;

        TrackPoint(LatLng position, boolean violation, long timeMs) {
            this(position, violation, false, timeMs);
        }

        TrackPoint(LatLng position, boolean violation, boolean joinBefore, long timeMs) {
            this.position = position;
            this.violation = violation;
            this.joinBefore = joinBefore;
            this.timeMs = timeMs;
        }
    }

    public static class ActiveTrip {
        public final String tid;
        public final String minMilli;

        ActiveTrip(String tid, String minMilli) {
            this.tid = tid;
            this.minMilli = minMilli;
        }
    }

    // Mirrors the engine's own active-trip lookup (trip_status = 0).
    public static ActiveTrip activeTrip() {
        Cursor c = null;
        try {
            SQLiteDatabase database = sqlitewraper.getDatabase();
            if (database == null) {
                return null;
            }
            c = database.rawQuery("select tid,min_milli from lat_plug where trip_status = 0", null);
            if (c.getCount() == 0) {
                return null;
            }
            c.moveToLast();
            String tid = c.getString(0);
            String minMilli = c.getString(1);
            if (minMilli == null || minMilli.length() == 0) {
                return null;
            }
            return new ActiveTrip(tid, minMilli);
        } catch (Exception e) {
            return null;
        } finally {
            if (c != null) {
                c.close();
            }
        }
    }

    // tripflag 2 = fused location, 3 = speed violation — same filter the
    // uploader uses, so the drawn path matches what the server will receive.
    public static List<TrackPoint> read(ActiveTrip trip) {
        List<TrackPoint> points = new ArrayList<TrackPoint>();
        if (trip == null) {
            return points;
        }
        Cursor c = null;
        try {
            SQLiteDatabase database = sqlitewraper.getDatabase();
            if (database == null) {
                return points;
            }
            c = database.rawQuery(
                    "select lat,lon,tripflag,date from track_master where tripflag IN (2,3) and date>="
                            + trip.minMilli + " order by date", null);
            if (c.getCount() == 0) {
                return points;
            }
            for (c.moveToFirst(); !c.isAfterLast(); c.moveToNext()) {
                String lat = c.getString(0);
                String lon = c.getString(1);
                if (lat == null || lon == null || lat.length() == 0 || lon.length() == 0) {
                    continue;
                }
                try {
                    points.add(new TrackPoint(
                            new LatLng(Double.parseDouble(lat), Double.parseDouble(lon)),
                            MapConstants.TRIPFLAG_VIOLATION.equals(c.getString(2)),
                            parseTime(c.getString(3))));
                } catch (NumberFormatException ignored) {
                    // A malformed row must not drop the rest of the path.
                }
            }
            return points;
        } catch (Exception e) {
            return points;
        } finally {
            if (c != null) {
                c.close();
            }
        }
    }

    // A path handed over by the caller: JSON array of [lat, lon, tripflag].
    // Used for trips downloaded from the server; nothing is read from, or
    // written to, the local tables.
    /**
     * Over-speed events the engine recorded in a window (maxMilli <= 0: until now). These are
     * the violations; red map points also mark short bursts below the configured duration.
     */
    public static int countSpeedEvents(long minMilli, long maxMilli) {
        if (minMilli <= 0) return 0;
        Cursor c = null;
        try {
            SQLiteDatabase database = sqlitewraper.getDatabase();
            if (database == null) return 0;
            String sql = "select count(*) from Events where lower(Event_type) = 'speed' and (Event_strt+0) >= " + minMilli;
            if (maxMilli > 0) sql += " and (Event_strt+0) <= " + maxMilli;
            c = database.rawQuery(sql, null);
            return c.moveToFirst() ? c.getInt(0) : 0;
        } catch (Exception e) {
            return 0;
        } finally {
            if (c != null) c.close();
        }
    }

    private static long parseTime(String s) {
        try {
            return s == null ? 0L : Long.parseLong(s.trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    public static List<TrackPoint> fromJson(String json) {
        List<TrackPoint> points = new ArrayList<TrackPoint>();
        if (json == null || json.length() == 0) {
            return points;
        }
        try {
            org.json.JSONArray arr = new org.json.JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                org.json.JSONArray p = arr.optJSONArray(i);
                if (p == null || p.length() < 2) {
                    continue;
                }
                double lat = p.optDouble(0, Double.NaN);
                double lon = p.optDouble(1, Double.NaN);
                if (Double.isNaN(lat) || Double.isNaN(lon)) {
                    continue;
                }
                points.add(new TrackPoint(new LatLng(lat, lon),
                        MapConstants.TRIPFLAG_VIOLATION.equals(String.valueOf(p.optInt(2, 2))),
                        !points.isEmpty() && p.optInt(3, 0) == 1,
                        p.optLong(4, 0L)));
            }
        } catch (Exception e) {
            // A malformed payload draws no path rather than crashing the map.
        }
        return points;
    }

    // Historical window for a lat_plug row. maxMilli <= 0 means until now
    // (live trip). Same tripflag filter as read(ActiveTrip).
    public static List<TrackPoint> readWindow(long minMilli, long maxMilli) {
        List<TrackPoint> points = new ArrayList<TrackPoint>();
        if (minMilli <= 0) {
            return points;
        }
        Cursor c = null;
        try {
            SQLiteDatabase database = sqlitewraper.getDatabase();
            if (database == null) {
                return points;
            }
            String sql = "select lat,lon,tripflag,date from track_master where tripflag IN (2,3) and date>="
                    + minMilli;
            if (maxMilli > 0) {
                sql += " and date<=" + maxMilli;
            }
            sql += " order by date";
            c = database.rawQuery(sql, null);
            if (c.getCount() == 0) {
                return points;
            }
            for (c.moveToFirst(); !c.isAfterLast(); c.moveToNext()) {
                String lat = c.getString(0);
                String lon = c.getString(1);
                if (lat == null || lon == null || lat.length() == 0 || lon.length() == 0) {
                    continue;
                }
                try {
                    points.add(new TrackPoint(
                            new LatLng(Double.parseDouble(lat), Double.parseDouble(lon)),
                            MapConstants.TRIPFLAG_VIOLATION.equals(c.getString(2)),
                            parseTime(c.getString(3))));
                } catch (NumberFormatException ignored) {
                }
            }
            return points;
        } catch (Exception e) {
            return points;
        } finally {
            if (c != null) {
                c.close();
            }
        }
    }
}
