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

        TrackPoint(LatLng position, boolean violation) {
            this.position = position;
            this.violation = violation;
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
                    "select lat,lon,tripflag from track_master where tripflag IN (2,3) and date>="
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
                            MapConstants.TRIPFLAG_VIOLATION.equals(c.getString(2))));
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
}
