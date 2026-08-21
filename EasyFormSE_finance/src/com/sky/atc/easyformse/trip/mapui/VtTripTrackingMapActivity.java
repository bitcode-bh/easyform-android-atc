package com.sky.atc.easyformse.trip.mapui;

import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.location.Location;
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
import com.google.maps.android.clustering.view.DefaultClusterRenderer;
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
    private LinearLayout statsCard;
    private TextView statsTitle;
    private TextView statsDistance;
    private TextView statsTime;
    private TextView statsViolations;

    // Sites currently drawn (after range + search); allSites is the full result
    // of the last range load, so searching never re-runs the distance filter.
    private final List<MapSite> sites = new ArrayList<MapSite>();
    private final List<MapSite> allSites = new ArrayList<MapSite>();
    private final List<Marker> siteMarkers = new ArrayList<Marker>();
    private final List<Polyline> pathOverlays = new ArrayList<Polyline>();
    private MapProfile profile;
    private JSONArray payloadSites;
    private String clusterValue;
    private boolean fromGeofenceTracking;
    private Circle radiusOverlay;

    private LinearLayout rangeBar;
    private TextView refreshButton;
    private EditText searchInput;
    private String searchTerm = "";
    // null = no distance cap ("All"). Set from the range chips.
    private Double radiusKm;
    // True once the user has tapped a range chip themselves — after that,
    // a late-arriving position must not silently override their choice.
    private boolean rangeExplicitlySet;
    private MapSiteLoader.Result lastResult;

    private ClusterManager<MapSiteClusterItem> clusterManager;
    private Button routeButton;
    private MapSite selectedSite;
    private Polyline plannedRoute;
    private final RouteOverlayHelper routeHelper = new RouteOverlayHelper();

    private LatLng userPosition;
    private Marker userMarker;
    private Marker pathStartMarker;
    private Marker pathEndMarker;
    private long pathMinMs;
    private long pathMaxMs;
    private boolean routeOverlay;
    private String routeTitle;
    private final List<TrackPathReader.TrackPoint> lastPathPoints = new ArrayList<TrackPathReader.TrackPoint>();

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
        if (routeOverlay) {
            getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        } else {
            getWindow().setBackgroundDrawable(new ColorDrawable(Color.WHITE));
        }
        setContentView(buildLayout());

        SupportMapFragment mapFragment = SupportMapFragment.newInstance();
        getSupportFragmentManager().beginTransaction().replace(mapContainerId, mapFragment).commitNow();
        mapFragment.getMapAsync(this);

        locationReceiver = new MapBroadcastReceiver(new MapBroadcastReceiver.Listener() {
            @Override
            public void onEngineLocation(LatLng position) {
                if (routeOverlay) {
                    return;
                }
                // The engine had no location yet when onMapReady() ran its
                // one-shot read, so the profile's own default radius
                // (NEARBY_RADIUS/GEOFENCE_DOWNLOAD) was skipped and the
                // range chips came up permanently disabled — this was a
                // real bug: a cold app start racing the map open is exactly
                // when the engine is least likely to have a fix yet. Give
                // both a real chance the first time a position actually
                // arrives, rather than leaving the whole session stuck on
                // "All". map != null guards against this firing before
                // onMapReady() itself has run (its own read already covers
                // that case). A user-picked range is never overridden.
                boolean firstFix = (userPosition == null && map != null);
                userPosition = position;
                drawUserMarker();
                if (firstFix) {
                    if (!rangeExplicitlySet) {
                        radiusKm = MapSiteLoader.defaultRadiusKm(profile);
                    }
                    reloadForRange();
                    frameCamera();
                }
            }
        });
        LocalBroadcastManager.getInstance(this).registerReceiver(
                locationReceiver, new IntentFilter(MapConstants.ACTION_TRIP_LOCATION));
    }

    private View buildLayout() {
        if (routeOverlay) {
            return buildRouteOverlayLayout();
        }
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        FrameLayout mapContainer = new FrameLayout(this);
        mapContainerId = View.generateViewId();
        mapContainer.setId(mapContainerId);
        root.addView(mapContainer, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.VERTICAL);
        topBar.setBackgroundColor(Color.parseColor("#CC215BA8"));
        topBar.setPadding(24, 24, 24, 20);

        // Header and refresh share one row so the icon sits at the top-right
        // without stealing vertical space from the search/chips below.
        LinearLayout headerRow = new LinearLayout(this);
        headerRow.setOrientation(LinearLayout.HORIZONTAL);
        headerRow.setGravity(Gravity.CENTER_VERTICAL);

        headerView = new TextView(this);
        headerView.setTextColor(Color.WHITE);
        headerView.setPadding(8, 0, 8, 16);
        LinearLayout.LayoutParams headerTextParams = new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        headerRow.addView(headerView, headerTextParams);

        refreshButton = new TextView(this);
        refreshButton.setText("↻");
        refreshButton.setTextColor(Color.WHITE);
        refreshButton.setTextSize(22f);
        refreshButton.setPadding(20, 0, 12, 16);
        refreshButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                refreshFromLocalSources();
            }
        });
        headerRow.addView(refreshButton);

        topBar.addView(headerRow);

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

        statsCard = buildStatsCard();
        FrameLayout.LayoutParams statsParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
        statsParams.gravity = Gravity.BOTTOM;
        int gutter = dp(12);
        statsParams.setMargins(gutter, gutter, gutter, gutter);
        root.addView(statsCard, statsParams);

        return root;
    }

    // Trip-list overlay: native Maps SDK (the JS key cannot load in WebView).
    // Same card chrome as the old popup — grey bar, 12dp corners — over a dim scrim.
    private View buildRouteOverlayLayout() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#99000000"));
        root.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(roundedBackground(Color.parseColor("#fcfcfb"), dp(12)));
        card.setClipToOutline(true);
        card.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Swallow so tapping the card does not dismiss.
            }
        });

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setBackgroundColor(Color.parseColor("#ecedef"));
        bar.setPadding(dp(4), 0, dp(12), 0);
        bar.setMinimumHeight(dp(48));

        TextView back = new TextView(this);
        back.setText("←");
        back.setTextColor(Color.parseColor("#0D1829"));
        back.setTextSize(22f);
        back.setPadding(dp(12), dp(10), dp(12), dp(10));
        back.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        bar.addView(back);

        TextView title = new TextView(this);
        String label = (routeTitle != null && routeTitle.length() > 0 && !routeTitle.equals("0") && !routeTitle.equals("0.0") && !routeTitle.equalsIgnoreCase("o") && !routeTitle.equalsIgnoreCase("null")) ? routeTitle : "Trip route";
        title.setText(label);
        title.setTextColor(Color.parseColor("#0D1829"));
        title.setTextSize(14f);
        title.setMaxLines(1);
        title.setEllipsize(android.text.TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        bar.addView(title, titleLp);
        card.addView(bar, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(48)));

        FrameLayout mapContainer = new FrameLayout(this);
        mapContainerId = View.generateViewId();
        mapContainer.setId(mapContainerId);
        card.addView(mapContainer, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));

        int w = Math.round(getResources().getDisplayMetrics().widthPixels * 0.94f);
        int h = Math.round(getResources().getDisplayMetrics().heightPixels * 0.78f);
        FrameLayout.LayoutParams cardLp = new FrameLayout.LayoutParams(w, h, Gravity.CENTER);
        root.addView(card, cardLp);
        return root;
    }

    // Same language as Home trip_stats + Trips list: grey #ecedef card,
    // 12dp corners, three metric cells.
    private LinearLayout buildStatsCard() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(roundedBackground(Color.parseColor("#ecedef"), dp(12)));
        card.setPadding(dp(14), dp(12), dp(14), dp(12));
        card.setElevation(dp(4));
        card.setVisibility(View.GONE);

        statsTitle = new TextView(this);
        statsTitle.setText("TRIP");
        statsTitle.setTextColor(Color.parseColor("#6b7280"));
        statsTitle.setTextSize(12f);
        statsTitle.setTypeface(Typeface.DEFAULT_BOLD);
        statsTitle.setLetterSpacing(0.02f);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        titleLp.bottomMargin = dp(8);
        card.addView(statsTitle, titleLp);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        statsDistance = addMetricCell(row, "Distance");
        statsTime = addMetricCell(row, "Time");
        statsViolations = addMetricCell(row, "Violations");
        card.addView(row, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        return card;
    }

    private TextView addMetricCell(LinearLayout row, String label) {
        LinearLayout cell = new LinearLayout(this);
        cell.setOrientation(LinearLayout.VERTICAL);
        cell.setGravity(Gravity.CENTER);
        cell.setBackground(roundedBackground(Color.parseColor("#fcfcfb"), dp(6)));
        cell.setPadding(dp(6), dp(8), dp(6), dp(8));

        TextView value = new TextView(this);
        value.setText("—");
        value.setTextColor(Color.parseColor("#0D1829"));
        value.setTextSize(16f);
        value.setTypeface(Typeface.DEFAULT_BOLD);
        value.setGravity(Gravity.CENTER);
        cell.addView(value);

        TextView caption = new TextView(this);
        caption.setText(label);
        caption.setTextColor(Color.parseColor("#6A6C74"));
        caption.setTextSize(11f);
        caption.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams capLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        capLp.topMargin = dp(2);
        cell.addView(caption, capLp);

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        lp.rightMargin = "Violations".equals(label) ? 0 : dp(8);
        row.addView(cell, lp);
        return value;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private static GradientDrawable roundedBackground(int color) {
        return roundedBackground(color, 28f);
    }

    private static GradientDrawable roundedBackground(int color, float radiusPx) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(radiusPx);
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
                    rangeExplicitlySet = true;
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
            fromGeofenceTracking = intent.getBooleanExtra(MapConstants.EXTRA_FROM_GEOFENCE, false);
            pathMinMs = intent.getLongExtra(MapConstants.EXTRA_PATH_MIN_MS, 0);
            pathMaxMs = intent.getLongExtra(MapConstants.EXTRA_PATH_MAX_MS, 0);
            routeOverlay = intent.getBooleanExtra(MapConstants.EXTRA_ROUTE_OVERLAY, false);
            routeTitle = intent.getStringExtra(MapConstants.EXTRA_ROUTE_TITLE);
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
        if (routeOverlay) {
            map.getUiSettings().setMapToolbarEnabled(false);
            map.getUiSettings().setMyLocationButtonEnabled(false);
            drawCoveredPath();
            frameCamera();
            return;
        }
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
                updateTripStatsCard();
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
        frameCamera();
    }

    // Re-reads geofence_tracking and redraws. This is a read-only refresh of
    // what is already on this device — it does NOT trigger the app's
    // download/sync (that is GeofencDownlodService, engine-owned, and this
    // module never writes or initiates network sync). Its real purpose is
    // picking up data that lands after the map was opened: a geofence
    // download finishing in the background.
    //
    // Additive: an empty re-read never blanks out a payload that already had
    // sites (the map opened with data, then a stale/failed re-read should not
    // take it away).
    private void refreshFromLocalSources() {
        JSONArray refreshed = GeofenceTrackingReader.read();
        if (refreshed.length() > 0) {
            payloadSites = refreshed;
            fromGeofenceTracking = true;
        }

        reloadForRange();
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
            if (payloadSites.length() == 0) {
                // Nothing to plot at all, from any source — this must win
                // over the radius branch below regardless of which chip
                // happens to be selected. Checking radiusKm first was a
                // real bug: whenever any range chip was active, "try a
                // wider range" was shown even when nothing was ever loaded
                // in the first place — actively wrong advice, since no range
                // would have helped.
                message = "No geofence data downloaded to this device yet.";
            } else if (radiusKm != null) {
                message = "No sites within " + trimDistance(radiusKm) + " km. Try a wider range.";
            } else {
                message = "No mapped sites to show.";
            }
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        }
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
        if (fromGeofenceTracking) {
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
        if (map == null) {
            return;
        }
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
                    .icon(BitmapDescriptorFactory.defaultMarker(markerHue(site))));
            if (marker != null) {
                marker.setTag(site);
                siteMarkers.add(marker);
            }
        }
    }

    // Completed vs still-outstanding, on the app's own status convention
    // (MapSite.isCompleted). Deliberately not green: the user's own position
    // marker is already HUE_GREEN, and a second green would read as "you are
    // here" at a glance. Violet reads as clearly distinct from both the
    // azure outstanding markers and the green user pin.
    private static float markerHue(MapSite site) {
        return site.isCompleted()
                ? BitmapDescriptorFactory.HUE_VIOLET
                : BitmapDescriptorFactory.HUE_AZURE;
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
        // Without this the library's default renderer draws every clustered
        // item in one colour, so the completed/outstanding distinction would
        // silently not apply to any clustering profile — which, given the
        // limit>50 default, is most of them.
        clusterManager.setRenderer(
                new DefaultClusterRenderer<MapSiteClusterItem>(this, map, clusterManager) {
                    @Override
                    protected void onBeforeClusterItemRendered(
                            MapSiteClusterItem item, MarkerOptions options) {
                        options.icon(BitmapDescriptorFactory.defaultMarker(markerHue(item.site)))
                                .title(item.site.siteName);
                    }
                });
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
        List<TrackPathReader.TrackPoint> points;
        if (pathMinMs > 0) {
            points = TrackPathReader.readWindow(pathMinMs, pathMaxMs);
        } else {
            TrackPathReader.ActiveTrip trip = TrackPathReader.activeTrip();
            points = TrackPathReader.read(trip);
        }
        lastPathPoints.clear();
        lastPathPoints.addAll(points);
        for (int i = 0; i < pathOverlays.size(); i++) {
            pathOverlays.get(i).remove();
        }
        pathOverlays.clear();
        if (pathStartMarker != null) {
            pathStartMarker.remove();
            pathStartMarker = null;
        }
        if (pathEndMarker != null) {
            pathEndMarker.remove();
            pathEndMarker = null;
        }
        if (points.size() < 1) {
            updateTripStatsCard();
            return;
        }
        pathStartMarker = map.addMarker(new MarkerOptions()
                .position(points.get(0).position)
                .title("Start")
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)));
        pathEndMarker = map.addMarker(new MarkerOptions()
                .position(points.get(points.size() - 1).position)
                .title("End")
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)));
        if (points.size() < 2) {
            updateTripStatsCard();
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
        updateTripStatsCard();
    }

    private void updateTripStatsCard() {
        if (statsCard == null) {
            return;
        }
        boolean tripContext = pathMinMs > 0 || !lastPathPoints.isEmpty();
        if (!tripContext) {
            statsCard.setVisibility(View.GONE);
            applyMapBottomPadding();
            return;
        }
        if (detailPanel != null && detailPanel.getVisibility() == View.VISIBLE) {
            statsCard.setVisibility(View.GONE);
            applyMapBottomPadding();
            return;
        }

        long startMs = pathMinMs;
        long endMs = pathMaxMs > 0 ? pathMaxMs : System.currentTimeMillis();
        if (startMs <= 0 && !lastPathPoints.isEmpty()) {
            TrackPathReader.ActiveTrip trip = TrackPathReader.activeTrip();
            if (trip != null) {
                try {
                    startMs = Long.parseLong(trip.minMilli);
                } catch (NumberFormatException ignored) {
                    startMs = 0;
                }
            }
        }

        statsTitle.setText(pathMinMs > 0 && pathMaxMs <= 0 ? "LIVE TRIP" : "TRIP");
        statsDistance.setText(formatDistanceKm(sumPathMeters(lastPathPoints)));
        statsTime.setText(formatDuration(startMs, endMs));
        statsViolations.setText(String.valueOf(countViolationRuns(lastPathPoints)));
        statsCard.setVisibility(View.VISIBLE);
        statsCard.post(new Runnable() {
            @Override
            public void run() {
                applyMapBottomPadding();
            }
        });
    }

    private void applyMapBottomPadding() {
        if (map == null || statsCard == null) {
            return;
        }
        int bottom = 0;
        if (statsCard.getVisibility() == View.VISIBLE) {
            bottom = statsCard.getHeight() + dp(16);
        }
        map.setPadding(0, 0, 0, bottom);
    }

    private static float sumPathMeters(List<TrackPathReader.TrackPoint> points) {
        float total = 0f;
        float[] out = new float[1];
        for (int i = 1; i < points.size(); i++) {
            LatLng a = points.get(i - 1).position;
            LatLng b = points.get(i).position;
            Location.distanceBetween(a.latitude, a.longitude, b.latitude, b.longitude, out);
            // Drop GPS jumps the engine already rejects (> 1 km between ticks).
            if (out[0] > 0f && out[0] <= 1000f) {
                total += out[0];
            }
        }
        return total;
    }

    private static int countViolationRuns(List<TrackPathReader.TrackPoint> points) {
        int runs = 0;
        boolean inRun = false;
        for (int i = 0; i < points.size(); i++) {
            if (points.get(i).violation) {
                if (!inRun) {
                    runs++;
                    inRun = true;
                }
            } else {
                inRun = false;
            }
        }
        return runs;
    }

    private static String formatDistanceKm(float meters) {
        if (meters < 1f) {
            return "0 km";
        }
        if (meters < 1000f) {
            return Math.round(meters) + " m";
        }
        return String.format(Locale.US, "%.1f km", meters / 1000f);
    }

    private static String formatDuration(long startMs, long endMs) {
        if (startMs <= 0 || endMs < startMs) {
            return "—";
        }
        long totalMin = (endMs - startMs) / 60000L;
        if (totalMin < 1L) {
            return "< 1m";
        }
        long h = totalMin / 60L;
        long m = totalMin % 60L;
        return h > 0 ? (h + "h " + m + "m") : (m + "m");
    }

    // Frames every drawn site (plus the user) so all of them are visible by
    // default, rather than centring on the user at a guessed zoom and leaving
    // farther sites off-screen — the previous behaviour, which made a map
    // that had genuinely loaded sites look empty until the user pinched out.
    // With no sites at all it still centres on the user so the map opens
    // somewhere meaningful instead of the world view.
    private void frameCamera() {
        if (map == null) {
            return;
        }
        if (pathMinMs > 0 && !lastPathPoints.isEmpty()) {
            if (lastPathPoints.size() == 1) {
                map.moveCamera(CameraUpdateFactory.newLatLngZoom(
                        lastPathPoints.get(0).position, MapConstants.SITE_ZOOM));
                return;
            }
            LatLngBounds.Builder pathBounds = new LatLngBounds.Builder();
            for (int i = 0; i < lastPathPoints.size(); i++) {
                pathBounds.include(lastPathPoints.get(i).position);
            }
            try {
                map.moveCamera(CameraUpdateFactory.newLatLngBounds(pathBounds.build(), 120));
            } catch (Exception e) {
                map.moveCamera(CameraUpdateFactory.newLatLngZoom(
                        lastPathPoints.get(0).position, MapConstants.SITE_ZOOM));
            }
            return;
        }
        if (sites.isEmpty()) {
            if (userPosition != null) {
                map.moveCamera(CameraUpdateFactory.newLatLngZoom(
                        userPosition, MapConstants.SITE_ZOOM));
            }
            return;
        }
        if (sites.size() == 1 && userPosition == null) {
            map.moveCamera(CameraUpdateFactory.newLatLngZoom(
                    new LatLng(sites.get(0).lat, sites.get(0).lon), MapConstants.SITE_ZOOM));
            return;
        }
        LatLngBounds.Builder bounds = new LatLngBounds.Builder();
        for (int i = 0; i < sites.size(); i++) {
            bounds.include(new LatLng(sites.get(i).lat, sites.get(i).lon));
        }
        if (userPosition != null) {
            bounds.include(userPosition);
        }
        // Guarded: newLatLngBounds throws if the map has not been laid out
        // yet (it needs real view dimensions to fit a bounds box), which is
        // reachable on the first-fix path from onEngineLocation().
        try {
            map.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds.build(), 120));
        } catch (Exception e) {
            LatLng fallback = userPosition != null
                    ? userPosition
                    : new LatLng(sites.get(0).lat, sites.get(0).lon);
            map.moveCamera(CameraUpdateFactory.newLatLngZoom(fallback, MapConstants.SITE_ZOOM));
        }
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
        if (statsCard != null) {
            statsCard.setVisibility(View.GONE);
            applyMapBottomPadding();
        }
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
        // Ended trip windows are static; keep polling for live / unbounded path.
        if (pathMinMs <= 0 || pathMaxMs <= 0) {
            pathHandler.postDelayed(pathPoll, MapConstants.PATH_POLL_MS);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        pathHandler.removeCallbacks(pathPoll);
    }

    @Override
    public void finish() {
        super.finish();
        if (routeOverlay) {
            overridePendingTransition(0, 0);
        }
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
