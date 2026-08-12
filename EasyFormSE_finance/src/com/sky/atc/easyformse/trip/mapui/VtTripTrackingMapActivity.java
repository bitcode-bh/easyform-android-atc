package com.sky.atc.easyformse.trip.mapui;

import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;
import com.google.maps.android.clustering.Cluster;
import com.google.maps.android.clustering.ClusterManager;
import com.sky.atc.easyformse.DeviceEventsUtils;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

// Read-only site map. Owns no location client: the user position comes from
// what the engine has already recorded, and updates arrive on the engine's
// existing broadcast (PRD FR-20, FR-25, FR-26).
//
// The view hierarchy is built in code on purpose — EasyFormSE_finance/res/ is
// gitignored, so an XML layout added here would never reach a clean checkout.
public class VtTripTrackingMapActivity extends AppCompatActivity implements OnMapReadyCallback {

    private GoogleMap map;
    private TextView headerView;
    private LinearLayout detailPanel;
    private TextView detailText;

    // Sites currently drawn (after range + search); allSites is the full result
    // of the last range load, so searching never re-runs the distance filter.
    private final List<MapSite> sites = new ArrayList<MapSite>();
    private final List<MapSite> allSites = new ArrayList<MapSite>();
    private final List<Marker> siteMarkers = new ArrayList<Marker>();
    private final List<Polyline> pathOverlays = new ArrayList<Polyline>();
    private MapProfile profile;
    private JSONArray payloadSites;
    private String clusterValue;
    private boolean fromOfflineTasks;
    private boolean fromGeofenceTracking;
    // -1 = not computed (the empty-map path that needed a diagnosis never ran).
    private int diagTotal = -1;
    private int diagDownloaded = -1;
    private int diagWithCoords = -1;
    private Circle radiusOverlay;

    private LinearLayout rangeBar;
    private EditText searchInput;
    private String searchTerm = "";
    // null = no distance cap ("All"). Set from the range chips.
    private Double radiusKm;
    private MapSiteLoader.Result lastResult;

    private ClusterManager<MapSiteClusterItem> clusterManager;
    private Button routeButton;
    private MapSite selectedSite;
    private Polyline plannedRoute;
    private final RouteOverlayHelper routeHelper = new RouteOverlayHelper();

    private LatLng userPosition;
    private Marker userMarker;

    private MapBroadcastReceiver locationReceiver;
    private int mapContainerId;
    private final Handler pathHandler = new Handler(Looper.getMainLooper());

    private final Runnable pathPoll = new Runnable() {
        @Override
        public void run() {
            drawCoveredPath();
            pathHandler.postDelayed(this, MapConstants.PATH_POLL_MS);
        }
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (!readPayload(getIntent())) {
            finish();
            return;
        }
        setContentView(buildLayout());

        SupportMapFragment mapFragment = SupportMapFragment.newInstance();
        getSupportFragmentManager().beginTransaction().replace(mapContainerId, mapFragment).commitNow();
        mapFragment.getMapAsync(this);

        locationReceiver = new MapBroadcastReceiver(new MapBroadcastReceiver.Listener() {
            @Override
            public void onEngineLocation(LatLng position) {
                userPosition = position;
                drawUserMarker();
            }
        });
        LocalBroadcastManager.getInstance(this).registerReceiver(
                locationReceiver, new IntentFilter(MapConstants.ACTION_TRIP_LOCATION));
    }

    private View buildLayout() {
        FrameLayout root = new FrameLayout(this);

        FrameLayout mapContainer = new FrameLayout(this);
        mapContainerId = View.generateViewId();
        mapContainer.setId(mapContainerId);
        root.addView(mapContainer, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.VERTICAL);
        topBar.setBackgroundColor(Color.parseColor("#CC215BA8"));
        topBar.setPadding(24, 24, 24, 20);

        headerView = new TextView(this);
        headerView.setTextColor(Color.WHITE);
        headerView.setPadding(8, 0, 8, 16);
        topBar.addView(headerView);

        searchInput = new EditText(this);
        searchInput.setHint("Search site name or ID");
        searchInput.setSingleLine(true);
        searchInput.setTextColor(Color.parseColor("#212121"));
        searchInput.setHintTextColor(Color.parseColor("#757575"));
        searchInput.setBackground(roundedBackground(Color.WHITE));
        searchInput.setPadding(24, 16, 24, 16);
        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void onTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void afterTextChanged(Editable s) {
                searchTerm = s.toString().trim().toLowerCase();
                // Search only re-filters what the current range already loaded.
                applySearch();
            }
        });
        topBar.addView(searchInput);

        rangeBar = new LinearLayout(this);
        rangeBar.setOrientation(LinearLayout.HORIZONTAL);
        HorizontalScrollView rangeScroll = new HorizontalScrollView(this);
        rangeScroll.setHorizontalScrollBarEnabled(false);
        rangeScroll.addView(rangeBar);
        LinearLayout.LayoutParams rangeParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        rangeParams.topMargin = 16;
        topBar.addView(rangeScroll, rangeParams);

        FrameLayout.LayoutParams headerParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
        headerParams.gravity = Gravity.TOP;
        root.addView(topBar, headerParams);

        detailPanel = new LinearLayout(this);
        detailPanel.setOrientation(LinearLayout.VERTICAL);
        detailPanel.setBackgroundColor(Color.WHITE);
        detailPanel.setPadding(36, 32, 36, 40);
        detailPanel.setVisibility(View.GONE);
        detailText = new TextView(this);
        detailText.setTextColor(Color.parseColor("#212121"));
        detailPanel.addView(detailText);

        routeButton = new Button(this);
        routeButton.setText("Show route");
        routeButton.setAllCaps(false);
        routeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                requestRoute();
            }
        });
        detailPanel.addView(routeButton);
        FrameLayout.LayoutParams detailParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
        detailParams.gravity = Gravity.BOTTOM;
        root.addView(detailPanel, detailParams);

        return root;
    }

    private static GradientDrawable roundedBackground(int color) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(28f);
        return d;
    }

    // Range chips. "All" (null) removes the distance cap entirely, so the map
    // still renders when nothing is nearby rather than coming up empty.
    private void buildRangeChips() {
        rangeBar.removeAllViews();
        final Double[] options = new Double[]{
                Double.valueOf(50), Double.valueOf(100), Double.valueOf(200), Double.valueOf(500), null};
        for (int i = 0; i < options.length; i++) {
            final Double option = options[i];
            TextView chip = new TextView(this);
            chip.setText(option == null ? "All" : (trimDistance(option) + " km"));
            boolean active = (option == null && radiusKm == null)
                    || (option != null && radiusKm != null && option.doubleValue() == radiusKm.doubleValue());
            chip.setTextColor(active ? Color.parseColor("#215BA8") : Color.WHITE);
            chip.setBackground(roundedBackground(active ? Color.WHITE : Color.parseColor("#33FFFFFF")));
            chip.setPadding(28, 12, 28, 12);
            // Distance filtering needs an origin; without one only "All" is real.
            chip.setEnabled(option == null || userPosition != null);
            chip.setAlpha(chip.isEnabled() ? 1f : 0.45f);
            chip.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    if (option != null && userPosition == null) {
                        Toast.makeText(VtTripTrackingMapActivity.this,
                                "Your location is unknown, so sites cannot be filtered by distance.",
                                Toast.LENGTH_LONG).show();
                        return;
                    }
                    radiusKm = option;
                    reloadForRange();
                }
            });
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            lp.rightMargin = 14;
            rangeBar.addView(chip, lp);
        }
    }

    // Sites are not built here: distance-ranked profiles need the user position,
    // which is only read once the map is ready.
    private boolean readPayload(Intent intent) {
        if (intent == null) {
            return false;
        }
        try {
            profile = MapProfile.fromJson(new JSONObject(intent.getStringExtra(MapConstants.EXTRA_PROFILE)));
            payloadSites = new JSONArray(intent.getStringExtra(MapConstants.EXTRA_SITES));
            clusterValue = intent.getStringExtra(MapConstants.EXTRA_CLUSTER_VALUE);
            fromOfflineTasks = intent.getBooleanExtra(MapConstants.EXTRA_FROM_OFFLINE_TASKS, false);
            fromGeofenceTracking = intent.getBooleanExtra(MapConstants.EXTRA_FROM_GEOFENCE, false);
            diagTotal = intent.getIntExtra(MapConstants.EXTRA_DIAG_TOTAL, -1);
            diagDownloaded = intent.getIntExtra(MapConstants.EXTRA_DIAG_DOWNLOADED, -1);
            diagWithCoords = intent.getIntExtra(MapConstants.EXTRA_DIAG_WITH_COORDS, -1);
        } catch (Exception e) {
            return false;
        }
        // An empty site list is a valid state to render: the map still shows the
        // user's position and offers wider ranges. Only a missing/broken profile
        // is fatal.
        return profile != null;
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {
        map = googleMap;
        map.getUiSettings().setZoomControlsEnabled(true);
        map.setOnMarkerClickListener(new GoogleMap.OnMarkerClickListener() {
            @Override
            public boolean onMarkerClick(Marker marker) {
                Object tag = marker.getTag();
                if (tag instanceof MapSite) {
                    showSiteDetail((MapSite) tag);
                    return true;
                }
                return false;
            }
        });
        map.setOnMapClickListener(new GoogleMap.OnMapClickListener() {
            @Override
            public void onMapClick(LatLng latLng) {
                detailPanel.setVisibility(View.GONE);
                selectedSite = null;
                clearPlannedRoute();
            }
        });

        userPosition = readEngineLocation();
        // Start from the profile's own radius when it has one (same answer
        // MapSiteLoader itself would use), otherwise uncapped so the map
        // always has something to show. No position means no radius can be
        // honoured regardless of what the profile configures.
        radiusKm = userPosition != null ? MapSiteLoader.defaultRadiusKm(profile) : null;

        buildRangeChips();
        reloadForRange();
        drawUserMarker();
        drawCoveredPath();
        // Unconditional: with no sites at all the map should still open on the
        // user's own position rather than sitting at the world view.
        frameCamera();
    }

    // Re-runs the distance filter for the selected range, then redraws.
    private void reloadForRange() {
        MapSiteLoader.Result result = MapSiteLoader.load(
                profile, payloadSites, userPosition, clusterValue, radiusKm);
        allSites.clear();
        allSites.addAll(result.sites);
        lastResult = result;

        buildRangeChips();
        drawRadiusCircle(result.radiusApplied);
        applySearch();

        if (allSites.isEmpty()) {
            String message;
            if (radiusKm != null) {
                message = "No sites within " + trimDistance(radiusKm) + " km. Try a wider range.";
            } else if (payloadSites.length() == 0) {
                // Nothing to plot at all — say what would populate it rather
                // than leaving a blank map unexplained.
                message = emptyPayloadMessage();
            } else {
                message = "No mapped sites to show.";
            }
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        }
    }

    // Distinguishes "nothing downloaded to this device" from "downloaded but
    // the server sent no coordinates" — two different problems with two
    // different fixes, that a single generic message conflated before.
    // diagTotal stays -1 whenever the plugin didn't need to run the
    // diagnosis (there was JS-cached data, or the offline fallback found
    // rows) — this branch only reaches here when both were empty.
    private String emptyPayloadMessage() {
        if (diagTotal < 0) {
            return "No downloaded sites with coordinates. Open a site list first.";
        }
        if (diagTotal == 0) {
            // Reached only after geofence_tracking was also checked and had
            // nothing plottable, so this is genuinely "nothing anywhere",
            // not just "task_master is empty".
            return "No tasks or geofence data downloaded to this device yet. "
                    + "Open a site list first.";
        }
        if (diagDownloaded == 0) {
            return diagTotal + " task" + (diagTotal == 1 ? "" : "s") + " synced but download "
                    + "isn't finished yet. Finish downloading, then reopen Map.";
        }
        if (diagWithCoords == 0) {
            return diagDownloaded + " downloaded task" + (diagDownloaded == 1 ? "" : "s")
                    + " but none has site coordinates from the server.";
        }
        // withCoords > 0 but MapSite.fromJson still rejected every row (e.g.
        // coordinates out of range) — rare, but say something true rather
        // than repeat a message that implies zero usable data existed.
        return "Downloaded sites exist but none could be plotted.";
    }

    // Filters the current range's sites by the search box and redraws markers.
    private void applySearch() {
        sites.clear();
        for (int i = 0; i < allSites.size(); i++) {
            if (matchesSearch(allSites.get(i))) {
                sites.add(allSites.get(i));
            }
        }
        headerView.setText(buildHeader(lastResult));
        drawSiteMarkers();
    }

    private boolean matchesSearch(MapSite site) {
        if (searchTerm.length() == 0) {
            return true;
        }
        return (site.siteName != null && site.siteName.toLowerCase().contains(searchTerm))
                || (site.siteId != null && site.siteId.toLowerCase().contains(searchTerm));
    }

    // Describes what is actually on screen: the drawn count, the active range,
    // and any search. Never claims a distance was applied when it was not — a
    // map with no known position cannot say sites are "within N km".
    private String buildHeader(MapSiteLoader.Result result) {
        int n = sites.size();
        StringBuilder text = new StringBuilder();
        text.append(n).append(n == 1 ? " nearby site" : " nearby sites");

        if (result != null && result.radiusApplied && result.effectiveRadiusKm != null) {
            text.append(" within ").append(trimDistance(result.effectiveRadiusKm)).append(" km");
        } else if (userPosition == null) {
            text.append(" (location unknown)");
        }
        boolean isDateRange = MapProfile.TYPE_DATE_RANGE.equals(profile.type);
        if (result != null && result.dateApplied) {
            // dateApplied covers two distinct meanings depending on type —
            // ASSIGNED_CLUSTER_TODAY's fixed "today" window, or DATE_RANGE's
            // configured [start, end). Say whichever is actually true.
            text.append(isDateRange ? ", " + dateRangeLabel() : ", today");
        } else if (isDateRange) {
            // Configured as DATE_RANGE but start/end were missing or invalid
            // — filter silently skipped, so say so rather than implying every
            // site shown is date-scoped.
            text.append(", no date range set");
        }
        if (result != null && profile.isCluster() && !result.clusterApplied) {
            text.append(", cluster unknown");
        }
        if (fromOfflineTasks) {
            text.append(" (downloaded)");
        } else if (fromGeofenceTracking) {
            text.append(" (geofence)");
        }
        if (searchTerm.length() > 0) {
            text.append(" matching \"").append(searchInput.getText().toString().trim()).append('"');
        } else if (result != null && result.matchedBeforeLimit > result.sites.size()) {
            // Say so rather than quietly showing fewer than matched — but
            // "nearest" is only true when the list was actually distance
            // sorted; otherwise this is just the first N in source order.
            text.append(result.sortedByDistance ? " (nearest " : " (showing ")
                    .append(result.sites.size())
                    .append(" of ").append(result.matchedBeforeLimit).append(')');
        }
        return text.toString();
    }

    private static String trimDistance(double km) {
        if (km == Math.rint(km)) {
            return String.valueOf((long) km);
        }
        return String.valueOf(km);
    }

    private String dateRangeLabel() {
        SimpleDateFormat fmt = new SimpleDateFormat("MMM d", Locale.getDefault());
        return fmt.format(new Date(profile.startMs)) + " – " + fmt.format(new Date(profile.endMs));
    }

    private void drawRadiusCircle(boolean radiusApplied) {
        if (radiusOverlay != null) {
            radiusOverlay.remove();
            radiusOverlay = null;
        }
        if (!radiusApplied || userPosition == null || radiusKm == null) {
            return;
        }
        radiusOverlay = map.addCircle(new CircleOptions()
                .center(userPosition)
                .radius(radiusKm * 1000d)
                .strokeWidth(3f)
                .strokeColor(MapConstants.COLOR_RADIUS_STROKE)
                .fillColor(MapConstants.COLOR_RADIUS_FILL));
    }

    // One-shot read of the position the engine last stored; no location client.
    private LatLng readEngineLocation() {
        try {
            LatLng position = DeviceEventsUtils.getCurrentLatLng();
            if (position == null || (position.latitude == 0 && position.longitude == 0)) {
                return null;
            }
            return position;
        } catch (Exception e) {
            return null;
        }
    }

    // Called on every range/search change, so previously drawn markers must be
    // cleared first or they accumulate. Also reachable from the search box's
    // TextWatcher, which is wired up in onCreate() — before onMapReady() has
    // necessarily set `map` — so this must tolerate running with no map yet
    // rather than assume it always follows onMapReady (ClusterManager's own
    // constructor and map.setOnMarkerClickListener() below both dereference
    // it unconditionally otherwise).
    private void drawSiteMarkers() {
        if (map == null) {
            return;
        }
        for (int i = 0; i < siteMarkers.size(); i++) {
            siteMarkers.get(i).remove();
        }
        siteMarkers.clear();
        if (clusterManager != null) {
            clusterManager.clearItems();
            clusterManager.cluster();
        }

        if (profile.markerCluster) {
            drawClusteredSiteMarkers();
            return;
        }
        for (int i = 0; i < sites.size(); i++) {
            MapSite site = sites.get(i);
            Marker marker = map.addMarker(new MarkerOptions()
                    .position(new LatLng(site.lat, site.lon))
                    .title(site.siteName)
                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)));
            if (marker != null) {
                marker.setTag(site);
                siteMarkers.add(marker);
            }
        }
    }

    // FR-21. ClusterManager has to own the camera-idle and marker-click
    // callbacks for clustering to work, so it replaces the plain marker
    // listener set in onMapReady rather than coexisting with it.
    private void drawClusteredSiteMarkers() {
        if (clusterManager != null) {
            addClusterItems();
            return;
        }
        clusterManager = new ClusterManager<MapSiteClusterItem>(this, map);
        clusterManager.setOnClusterItemClickListener(
                new ClusterManager.OnClusterItemClickListener<MapSiteClusterItem>() {
                    @Override
                    public boolean onClusterItemClick(MapSiteClusterItem item) {
                        showSiteDetail(item.site);
                        return true;
                    }
                });
        clusterManager.setOnClusterClickListener(
                new ClusterManager.OnClusterClickListener<MapSiteClusterItem>() {
                    @Override
                    public boolean onClusterClick(Cluster<MapSiteClusterItem> cluster) {
                        // Zoom into the group rather than opening a sheet for it.
                        map.animateCamera(CameraUpdateFactory.newLatLngZoom(
                                cluster.getPosition(), map.getCameraPosition().zoom + 2f));
                        return true;
                    }
                });
        map.setOnMarkerClickListener(clusterManager);
        map.setOnCameraIdleListener(clusterManager);
        addClusterItems();
    }

    private void addClusterItems() {
        List<MapSiteClusterItem> items = new ArrayList<MapSiteClusterItem>();
        for (int i = 0; i < sites.size(); i++) {
            items.add(new MapSiteClusterItem(sites.get(i)));
        }
        clusterManager.addItems(items);
        clusterManager.cluster();
    }

    private void drawUserMarker() {
        if (map == null || userPosition == null) {
            return;
        }
        if (userMarker != null) {
            userMarker.remove();
        }
        userMarker = map.addMarker(new MarkerOptions()
                .position(userPosition)
                .title("You")
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));
    }

    private void drawCoveredPath() {
        if (map == null) {
            return;
        }
        TrackPathReader.ActiveTrip trip = TrackPathReader.activeTrip();
        if (trip == null) {
            return;
        }
        List<TrackPathReader.TrackPoint> points = TrackPathReader.read(trip);
        for (int i = 0; i < pathOverlays.size(); i++) {
            pathOverlays.get(i).remove();
        }
        pathOverlays.clear();
        if (points.size() < 2) {
            return;
        }

        // Group consecutive points of the same kind so a long trip draws a few
        // polylines rather than one per pair.
        int runStart = 0;
        for (int i = 1; i <= points.size(); i++) {
            boolean endOfRun = (i == points.size())
                    || (points.get(i).violation != points.get(runStart).violation);
            if (!endOfRun) {
                continue;
            }
            PolylineOptions options = new PolylineOptions().width(10f).color(
                    points.get(runStart).violation ? MapConstants.COLOR_VIOLATION : MapConstants.COLOR_COVERED);
            for (int j = runStart; j < i; j++) {
                options.add(points.get(j).position);
            }
            if (i < points.size()) {
                options.add(points.get(i).position);
            }
            pathOverlays.add(map.addPolyline(options));
            runStart = i;
        }
    }

    // Centres on the user so the map opens on "where I am, what is around me".
    // Falls back to framing the sites only when there is no known position.
    private void frameCamera() {
        if (userPosition != null) {
            map.moveCamera(CameraUpdateFactory.newLatLngZoom(
                    userPosition, zoomForNearest()));
            return;
        }
        if (sites.isEmpty()) {
            return;
        }
        if (sites.size() == 1) {
            map.moveCamera(CameraUpdateFactory.newLatLngZoom(
                    new LatLng(sites.get(0).lat, sites.get(0).lon), MapConstants.SITE_ZOOM));
            return;
        }
        LatLngBounds.Builder bounds = new LatLngBounds.Builder();
        for (int i = 0; i < sites.size(); i++) {
            bounds.include(new LatLng(sites.get(i).lat, sites.get(i).lon));
        }
        map.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds.build(), 120));
    }

    // Zoom that keeps the closest site in view; street level when none is known.
    private float zoomForNearest() {
        double nearestKm = Double.MAX_VALUE;
        for (int i = 0; i < sites.size(); i++) {
            double d = sites.get(i).distanceM;
            if (d >= 0 && d / 1000d < nearestKm) {
                nearestKm = d / 1000d;
            }
        }
        if (nearestKm == Double.MAX_VALUE) {
            return MapConstants.SITE_ZOOM;
        }
        if (nearestKm <= 2) {
            return 14f;
        }
        if (nearestKm <= 10) {
            return 12f;
        }
        if (nearestKm <= 50) {
            return 10f;
        }
        if (nearestKm <= 150) {
            return 8f;
        }
        return 6f;
    }

    private void showSiteDetail(MapSite site) {
        StringBuilder text = new StringBuilder();
        text.append(site.siteName);
        if (site.siteId != null && site.siteId.length() > 0) {
            text.append("\nSite ID: ").append(site.siteId);
        }
        if (site.distanceM >= 0) {
            text.append("\nDistance: ").append(Math.round(site.distanceM / 100d) / 10d).append(" km");
        }
        if (site.status != null && site.status.length() > 0) {
            text.append("\nStatus: ").append(site.status);
        }
        if (site.moduleName != null && site.moduleName.length() > 0) {
            // Informational only, not a deep link (see PRD open question
            // OQ-3): every site-click and module-click handler in this app
            // reads DOM state (a hidden input, a rendered list row) that
            // only exists on the page that rendered it, so none is safely
            // callable from here. Telling the user where to look is the
            // safe version of this feature.
            text.append("\nModule: ").append(site.moduleName)
                    .append("\nOpen ").append(site.moduleName)
                    .append(" from Home to view this site");
        }
        detailText.setText(text.toString());
        selectedSite = site;
        // Without a known origin there is no route to ask for.
        routeButton.setEnabled(userPosition != null);
        routeButton.setText(userPosition != null ? "Show route" : "Route needs your location");
        detailPanel.setVisibility(View.VISIBLE);
    }

    private void requestRoute() {
        if (selectedSite == null || userPosition == null) {
            return;
        }
        routeButton.setEnabled(false);
        routeButton.setText("Loading route");
        LatLng destination = new LatLng(selectedSite.lat, selectedSite.lon);
        routeHelper.request(userPosition, destination, new RouteOverlayHelper.Callback() {
            @Override
            public void onRoute(List<LatLng> path) {
                if (isFinishing() || map == null) {
                    return;
                }
                clearPlannedRoute();
                plannedRoute = map.addPolyline(new PolylineOptions()
                        .addAll(path)
                        .color(MapConstants.COLOR_PLANNED)
                        .width(10f));
                resetRouteButton();
            }

            @Override
            public void onFailed(String message) {
                if (isFinishing()) {
                    return;
                }
                Toast.makeText(VtTripTrackingMapActivity.this, message, Toast.LENGTH_SHORT).show();
                resetRouteButton();
            }
        });
    }

    private void resetRouteButton() {
        routeButton.setEnabled(true);
        routeButton.setText("Show route");
    }

    private void clearPlannedRoute() {
        if (plannedRoute != null) {
            plannedRoute.remove();
            plannedRoute = null;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        pathHandler.postDelayed(pathPoll, MapConstants.PATH_POLL_MS);
    }

    @Override
    protected void onPause() {
        super.onPause();
        pathHandler.removeCallbacks(pathPoll);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (locationReceiver != null) {
            LocalBroadcastManager.getInstance(this).unregisterReceiver(locationReceiver);
        }
        routeHelper.release();
    }
}
