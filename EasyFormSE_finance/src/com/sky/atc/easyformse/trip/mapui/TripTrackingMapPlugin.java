package com.sky.atc.easyformse.trip.mapui;

import android.content.Intent;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

// The module's only bridge into the app. See PRD §7.1 / §9.3.
public class TripTrackingMapPlugin extends CordovaPlugin {

    @Override
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext)
            throws JSONException {
        try {
            JSONObject payload = args.getJSONObject(0);
            JSONObject profileJson = payload.optJSONObject("profile");
            JSONArray sites = payload.optJSONArray("sites");

            // An empty site list is a valid state: the map opens on the user's
            // position and its range chips let them widen the search. Only a
            // missing/unusable profile stops it.
            MapProfile profile = MapProfile.fromJson(profileJson);
            if (profile == null) {
                callbackContext.error("trip_map: no map profile configured");
                return true;
            }
            if (sites == null) {
                sites = new JSONArray();
            }
            boolean fromOfflineTasks = false;
            boolean fromGeofenceTracking = false;
            OfflineTaskReader.Diagnosis diagnosis = null;

            if (MapProfile.TYPE_GEOFENCE_DOWNLOAD.equals(profile.type)) {
                // This profile's data source, per the PRD (§4.2/§11), is
                // geofence_tracking itself — whatever the listing pages
                // cached is a different profile's concern, not this one's.
                sites = GeofenceTrackingReader.read();
                fromGeofenceTracking = sites.length() > 0;
            } else if (sites.length() == 0) {
                // The JS cache only fills once a site list has been opened.
                // Tapping Map first (e.g. straight from Home) would
                // otherwise show an empty map, so fall back to the tasks
                // already downloaded on this device.
                String username = payload.optString("username", "");
                JSONArray offline = OfflineTaskReader.read(username);
                if (offline.length() > 0) {
                    sites = offline;
                    fromOfflineTasks = true;
                } else {
                    // Still nothing — geofence_tracking is populated by a
                    // separate download step that does not depend on a task
                    // list ever being opened, so it can hold data when
                    // task_master does not.
                    JSONArray geofence = GeofenceTrackingReader.read();
                    if (geofence.length() > 0) {
                        sites = geofence;
                        fromGeofenceTracking = true;
                    } else {
                        // Nothing anywhere — find out why so the map's empty
                        // state can say "never downloaded" versus
                        // "downloaded but no coordinates" instead of one
                        // generic message for both.
                        diagnosis = OfflineTaskReader.diagnose(username);
                    }
                }
            }

            Intent intent = new Intent(this.cordova.getActivity(), VtTripTrackingMapActivity.class);
            intent.putExtra(MapConstants.EXTRA_PROFILE, profileJson.toString());
            intent.putExtra(MapConstants.EXTRA_SITES, sites.toString());
            intent.putExtra(MapConstants.EXTRA_CLUSTER_VALUE, payload.optString("cluster_value", ""));
            intent.putExtra(MapConstants.EXTRA_USERNAME, payload.optString("username", ""));
            intent.putExtra(MapConstants.EXTRA_FROM_OFFLINE_TASKS, fromOfflineTasks);
            intent.putExtra(MapConstants.EXTRA_FROM_GEOFENCE, fromGeofenceTracking);
            if (diagnosis != null) {
                intent.putExtra(MapConstants.EXTRA_DIAG_TOTAL, diagnosis.total);
                intent.putExtra(MapConstants.EXTRA_DIAG_DOWNLOADED, diagnosis.downloaded);
                intent.putExtra(MapConstants.EXTRA_DIAG_WITH_COORDS, diagnosis.withCoords);
            }
            this.cordova.getActivity().startActivity(intent);

            callbackContext.success();
            return true;
        } catch (Exception e) {
            callbackContext.error("trip_map: " + e.getMessage());
            return true;
        }
    }
}
