package com.easyform.jitsi.network.requests;

import androidx.annotation.Keep;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Created by SavanSolanki on 20/06/2022.
 *
 * @author SavanSolanki
 * @apiNote this request Model class
 */
@Keep
public class Args {

    @Expose
    @SerializedName("zoom_meeting")
    private List<ZoomMeetingItem> zoomMeeting;

    public void setZoomMeeting(List<ZoomMeetingItem> zoomMeeting) {
        this.zoomMeeting = zoomMeeting;
    }

    public List<ZoomMeetingItem> getZoomMeeting() {
        return zoomMeeting;
    }

    @Override
    public String toString() {
        return "Args{" +
                "zoomMeeting=" + zoomMeeting +
                '}';
    }
}