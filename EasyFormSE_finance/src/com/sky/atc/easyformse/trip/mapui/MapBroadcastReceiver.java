package com.sky.atc.easyformse.trip.mapui;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import com.google.android.gms.maps.model.LatLng;

// Listens to the position the engine already broadcasts, so the map never
// starts a location client of its own (FR-25, FR-26).
public class MapBroadcastReceiver extends BroadcastReceiver {

    public interface Listener {
        void onEngineLocation(LatLng position);
    }

    private final Listener listener;

    public MapBroadcastReceiver(Listener listener) {
        this.listener = listener;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || listener == null) {
            return;
        }
        String lat = intent.getStringExtra(MapConstants.EXTRA_BROADCAST_LAT);
        String lon = intent.getStringExtra(MapConstants.EXTRA_BROADCAST_LON);
        if (lat == null || lon == null) {
            return;
        }
        try {
            listener.onEngineLocation(new LatLng(Double.parseDouble(lat), Double.parseDouble(lon)));
        } catch (NumberFormatException ignored) {
            // Malformed broadcast payload; keep the last known marker.
        }
    }
}
