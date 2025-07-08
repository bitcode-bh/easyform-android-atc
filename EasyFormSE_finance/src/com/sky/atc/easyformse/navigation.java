package com.sky.atc.easyformse;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.fragment.app.FragmentActivity;

import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.PolylineOptions;
import com.google.maps.DirectionsApi;
import com.google.maps.DirectionsApiRequest;
import com.google.maps.GeoApiContext;
import com.google.maps.model.DirectionsLeg;
import com.google.maps.model.DirectionsResult;
import com.google.maps.model.DirectionsRoute;
import com.google.maps.model.DirectionsStep;
import com.google.maps.model.EncodedPolyline;
import com.sky.atc.easyformse.utils.LogUtils;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


//to Draw path between origin and destination
public class navigation extends FragmentActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    private String user_lat;
    private String user_long;
    private String site_lat;
    private String site_long;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.map);
        // Obtain the SupportMapFragment and get notified when the map is ready to be used.

        try {

            SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                    .findFragmentById(R.id.map);

            Bundle data = this.getIntent().getExtras();
            user_lat = data.getString("user_lat");
            user_long = data.getString("user_long");
            site_lat = data.getString("site_lat");
            site_long = data.getString("site_long");

            mapFragment.getMapAsync(this);
        } catch (Exception e) {
            Bundle b = new Bundle();
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_OK, intent);
            finish();
        }

    }


    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera. In this case,
     * we just add a marker near Sydney, Australia.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        if (!user_lat.equalsIgnoreCase("") && !user_long.equalsIgnoreCase("") && !site_lat.equalsIgnoreCase("") && !site_long.equalsIgnoreCase("")) {
            LatLng site1 = new LatLng(Double.parseDouble(user_lat), Double.parseDouble(user_long));
            Marker m1 = mMap.addMarker(new MarkerOptions().position(site1).title("Site 1"));

            LatLng site2 = new LatLng(Double.parseDouble(site_lat), Double.parseDouble(site_long));
            Marker m2 = mMap.addMarker(new MarkerOptions().position(site2).title("Site 2"));

            List<Marker> list = new ArrayList<>();
            list.add(m1);
            list.add(m2);

            //Define list to get all latlng for the route
            List<LatLng> path = new ArrayList();


            //Execute Directions API request
            //Change API key for google map route
            GeoApiContext context = new GeoApiContext.Builder()
                    .apiKey("AIzaSyBndt0d8sD1d6dshx_D2Rkpv-QhJ5if0ME")
                    .build();
            String origin = user_lat + "," + user_long;
            String destination = site_lat + "," + site_long;
            DirectionsApiRequest req = DirectionsApi.getDirections(context, origin, destination);
            writeLogToFile(String.valueOf(req), "NEVIGATION");
            try {
                DirectionsResult res = req.await();
                if (res != null) {
                    writeLogToFile(String.valueOf(res), "NEVIGATION1");
                    //Loop through legs and steps to get encoded polylines of each step
                    if (res.routes != null && res.routes.length > 0) {
                        DirectionsRoute route = res.routes[0];

                        if (route.legs != null) {
                            for (int i = 0; i < route.legs.length; i++) {
                                DirectionsLeg leg = route.legs[i];
                                if (leg.steps != null) {
                                    for (int j = 0; j < leg.steps.length; j++) {
                                        DirectionsStep step = leg.steps[j];
                                        if (step.steps != null && step.steps.length > 0) {
                                            for (int k = 0; k < step.steps.length; k++) {
                                                DirectionsStep step1 = step.steps[k];
                                                EncodedPolyline points1 = step1.polyline;
                                                if (points1 != null) {
                                                    //Decode polyline and add points to list of route coordinates
                                                    List<com.google.maps.model.LatLng> coords1 = points1.decodePath();
                                                    for (com.google.maps.model.LatLng coord1 : coords1) {
                                                        path.add(new LatLng(coord1.lat, coord1.lng));
                                                    }
                                                }
                                            }
                                        } else {
                                            EncodedPolyline points = step.polyline;
                                            writeLogToFile("STEPMISSING", "NEVIGATION4");
                                            if (points != null) {
                                                //Decode polyline and add points to list of route coordinates
                                                List<com.google.maps.model.LatLng> coords = points.decodePath();
                                                for (com.google.maps.model.LatLng coord : coords) {
                                                    path.add(new LatLng(coord.lat, coord.lng));
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    Toast.makeText(getApplicationContext(), "Route Not Found", Toast.LENGTH_SHORT).show();
                    Bundle b = new Bundle();
                    Intent intent = new Intent();
                    intent.putExtras(b);
                    setResult(RESULT_OK, intent);
                    finish();
                }

            } catch (Exception ex) {
                Log.e("TAG", ex.getLocalizedMessage());
                writeLogToFile(ex.getMessage(), "NEVIGATION3");
            }

            //Draw the polyline
            if (path.size() > 0) {
                PolylineOptions opts = new PolylineOptions().addAll(path).color(Color.BLUE).width(5);
                mMap.addPolyline(opts);
            }

            mMap.getUiSettings().setZoomControlsEnabled(true);

            LatLngBounds.Builder builder = new LatLngBounds.Builder();
            for (Marker marker : list) {
                builder.include(marker.getPosition());
            }
            LatLngBounds bounds = builder.build();

            int padding = 10; // offset from edges of the map in pixels
            CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, padding);
            mMap.moveCamera(cu);

        } else {
            Toast.makeText(getApplicationContext(), "Latlong Missing", Toast.LENGTH_SHORT).show();
            Bundle b = new Bundle();
            Intent intent = new Intent();
            intent.putExtras(b);
            setResult(RESULT_OK, intent);
            finish();
        }
//		mMap.moveCamera(CameraUpdateFactory.newLatLng(site1));
//           mMap.animateCamera(CameraUpdateFactory.zoomTo(13));
    }

    @Override
    public void onBackPressed() {
        Bundle b = new Bundle();
        Intent intent = new Intent();
        intent.putExtras(b);
        setResult(RESULT_OK, intent);
        finish();
        super.onBackPressed();
    }

    private void writeLogToFile(String response, String method) {
        LogUtils.writeOthersLogToFile(response, method + " " + this.getClass().getName());
    }

}
