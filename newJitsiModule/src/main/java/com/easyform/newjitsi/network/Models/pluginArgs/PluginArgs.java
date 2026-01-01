package com.easyform.newjitsi.network.Models.pluginArgs;

import java.util.List;

import com.google.gson.annotations.SerializedName;

public class PluginArgs {
    @SerializedName("zoom_meeting")
    private List<ZoomMeetingItem> zoomMeeting;

    public List<ZoomMeetingItem> getZoomMeeting() {
        return zoomMeeting;
    }
}
