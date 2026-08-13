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

            // An empty site list is a valid state: the map opens on the user's
            // position and its range chips let them widen the search. Only a
            // missing/unusable profile stops it.
            MapProfile profile = MapProfile.fromJson(profileJson);
            if (profile == null) {
                callbackContext.error("trip_map: no map profile configured");
                return true;
            }

            // geofence_tracking is the map's single source of sites, for every
            // profile type — not just GEOFENCE_DOWNLOAD.
            //
            // The task_master path this replaced was unusable in practice: it
            // is filled only once tasks are actually downloaded, and on real
            // accounts it was repeatedly found empty while geofence_tracking
            // held data (geofence download is its own step and does not depend
            // on a task list ever being opened). The listing cache the JS layer
            // passes is not consulted either, so the map draws the same sites
            // no matter which screen it was opened from.
            JSONArray sites = GeofenceTrackingReader.read();

            Intent intent = new Intent(this.cordova.getActivity(), VtTripTrackingMapActivity.class);
            intent.putExtra(MapConstants.EXTRA_PROFILE, profileJson.toString());
            intent.putExtra(MapConstants.EXTRA_SITES, sites.toString());
            intent.putExtra(MapConstants.EXTRA_CLUSTER_VALUE, payload.optString("cluster_value", ""));
            intent.putExtra(MapConstants.EXTRA_FROM_GEOFENCE, sites.length() > 0);
            this.cordova.getActivity().startActivity(intent);

            callbackContext.success();
            return true;
        } catch (Exception e) {
            callbackContext.error("trip_map: " + e.getMessage());
            return true;
        }
    }
}
