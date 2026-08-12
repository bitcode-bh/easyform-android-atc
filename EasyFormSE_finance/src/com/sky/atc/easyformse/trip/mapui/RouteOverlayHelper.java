package com.sky.atc.easyformse.trip.mapui;

import android.os.Handler;
import android.os.Looper;

import com.google.android.gms.maps.model.LatLng;
import com.google.maps.DirectionsApi;
import com.google.maps.DirectionsApiRequest;
import com.google.maps.GeoApiContext;
import com.google.maps.model.DirectionsLeg;
import com.google.maps.model.DirectionsResult;
import com.google.maps.model.DirectionsRoute;
import com.google.maps.model.DirectionsStep;
import com.google.maps.model.EncodedPolyline;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

// Planned route from the user to a selected site (PRD FR-23). Read-only: it
// fetches and decodes a route for display and writes nothing.
//
// The leg/step/sub-step decoding mirrors navigation.java, which the PRD keeps
// on the blocklist. The one thing deliberately NOT copied is where the request
// runs: navigation.java calls the blocking DirectionsApiRequest.await() on the
// main thread inside a catch(Exception). NetworkOnMainThreadException is a
// RuntimeException, so it is swallowed there and the route silently never
// draws. Here the call runs on a background executor and only the result is
// posted back to the UI thread.
public final class RouteOverlayHelper {

    // Copied with the logic from navigation.java, which is on the blocklist and
    // cannot be changed to share a constant. The manifest's
    // com.google.android.maps.v2.API_KEY is a different key (Maps SDK
    // rendering); this one is the one proven against the Directions API in this
    // app. Worth consolidating once navigation.java is touchable.
    private static final String DIRECTIONS_API_KEY = "AIzaSyBndt0d8sD1d6dshx_D2Rkpv-QhJ5if0ME";

    public interface Callback {
        void onRoute(List<LatLng> path);

        void onFailed(String message);
    }

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());

    public void request(final LatLng origin, final LatLng destination, final Callback callback) {
        if (origin == null || destination == null || callback == null) {
            return;
        }
        executor.execute(new Runnable() {
            @Override
            public void run() {
                GeoApiContext context = null;
                try {
                    context = new GeoApiContext.Builder().apiKey(DIRECTIONS_API_KEY).build();
                    DirectionsApiRequest req = DirectionsApi.getDirections(
                            context,
                            origin.latitude + "," + origin.longitude,
                            destination.latitude + "," + destination.longitude);
                    final List<LatLng> path = decode(req.await());
                    main.post(new Runnable() {
                        @Override
                        public void run() {
                            if (path.isEmpty()) {
                                callback.onFailed("Route not found");
                            } else {
                                callback.onRoute(path);
                            }
                        }
                    });
                } catch (final Exception e) {
                    main.post(new Runnable() {
                        @Override
                        public void run() {
                            callback.onFailed("Route unavailable");
                        }
                    });
                } finally {
                    shutdown(context);
                }
            }
        });
    }

    private static List<LatLng> decode(DirectionsResult res) {
        List<LatLng> path = new ArrayList<LatLng>();
        if (res == null || res.routes == null || res.routes.length == 0) {
            return path;
        }
        DirectionsRoute route = res.routes[0];
        if (route.legs == null) {
            return path;
        }
        for (int i = 0; i < route.legs.length; i++) {
            DirectionsLeg leg = route.legs[i];
            if (leg == null || leg.steps == null) {
                continue;
            }
            for (int j = 0; j < leg.steps.length; j++) {
                DirectionsStep step = leg.steps[j];
                if (step == null) {
                    continue;
                }
                // Prefer the finer-grained sub-steps when present, matching
                // navigation.java's shape.
                if (step.steps != null && step.steps.length > 0) {
                    for (int k = 0; k < step.steps.length; k++) {
                        appendPolyline(path, step.steps[k] == null ? null : step.steps[k].polyline);
                    }
                } else {
                    appendPolyline(path, step.polyline);
                }
            }
        }
        return path;
    }

    private static void appendPolyline(List<LatLng> path, EncodedPolyline encoded) {
        if (encoded == null) {
            return;
        }
        List<com.google.maps.model.LatLng> coords = encoded.decodePath();
        if (coords == null) {
            return;
        }
        for (com.google.maps.model.LatLng coord : coords) {
            path.add(new LatLng(coord.lat, coord.lng));
        }
    }

    private static void shutdown(GeoApiContext context) {
        if (context == null) {
            return;
        }
        try {
            context.shutdown();
        } catch (Exception ignored) {
            // Nothing useful to do; the request is already finished.
        }
    }

    public void release() {
        executor.shutdownNow();
        main.removeCallbacksAndMessages(null);
    }
}
