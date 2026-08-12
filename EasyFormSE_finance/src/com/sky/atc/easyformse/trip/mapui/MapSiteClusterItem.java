package com.sky.atc.easyformse.trip.mapui;

import com.google.android.gms.maps.model.LatLng;
import com.google.maps.android.clustering.ClusterItem;

// Adapts a MapSite to the clustering library. Kept as a wrapper so MapSite
// stays a plain payload POJO with no dependency on android-maps-utils.
public class MapSiteClusterItem implements ClusterItem {

    public final MapSite site;
    private final LatLng position;

    public MapSiteClusterItem(MapSite site) {
        this.site = site;
        this.position = new LatLng(site.lat, site.lon);
    }

    @Override
    public LatLng getPosition() {
        return position;
    }

    @Override
    public String getTitle() {
        return site.siteName;
    }

    @Override
    public String getSnippet() {
        return site.siteId;
    }
}
