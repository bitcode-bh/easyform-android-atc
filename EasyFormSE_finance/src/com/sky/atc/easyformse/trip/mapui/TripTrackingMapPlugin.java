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
            if (profileJson == null && payload.optLong("path_min_ms", 0) > 0) {
                profileJson = new JSONObject();
                profileJson.put("type", MapProfile.TYPE_GEOFENCE_DOWNLOAD);
            }

            MapProfile profile = MapProfile.fromJson(profileJson);
            if (profile == null) {
                callbackContext.error("trip_map: no map profile configured");
                return true;
            }

            JSONArray sites;
            boolean overlay = payload.optBoolean("overlay", false);
            if (overlay) {
                sites = new JSONArray();
            } else {
                sites = GeofenceTrackingReader.read();
            }

            Intent intent = new Intent(this.cordova.getActivity(), VtTripTrackingMapActivity.class);
            intent.putExtra(MapConstants.EXTRA_PROFILE, profileJson.toString());
            intent.putExtra(MapConstants.EXTRA_SITES, sites.toString());
            intent.putExtra(MapConstants.EXTRA_CLUSTER_VALUE, payload.optString("cluster_value", ""));
            intent.putExtra(MapConstants.EXTRA_FROM_GEOFENCE, sites.length() > 0);
            intent.putExtra(MapConstants.EXTRA_PATH_MIN_MS, payload.optLong("path_min_ms", 0));
            intent.putExtra(MapConstants.EXTRA_PATH_MAX_MS, payload.optLong("path_max_ms", 0));
            intent.putExtra(MapConstants.EXTRA_ROUTE_OVERLAY, overlay);
            intent.putExtra(MapConstants.EXTRA_ROUTE_TITLE, payload.optString("title", ""));
            this.cordova.getActivity().startActivity(intent);
            if (overlay) {
                this.cordova.getActivity().overridePendingTransition(0, 0);
            }

            callbackContext.success();
            return true;
        } catch (Exception e) {
            callbackContext.error("trip_map: " + e.getMessage());
            return true;
        }
    }
}
