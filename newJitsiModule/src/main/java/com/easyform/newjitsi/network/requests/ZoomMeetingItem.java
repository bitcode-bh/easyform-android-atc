package com.easyform.newjitsi.network.requests;

import androidx.annotation.Keep;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

/**
 * Created by SavanSolanki on 20/06/2022.
 *
 * @author SavanSolanki
 * @apiNote this request Model class
 */
@Keep
public class ZoomMeetingItem {

    @Expose
    @SerializedName("fcmid")
    private String fcmid;

    @Expose
    @SerializedName("device_type")
    private String deviceType;

    @Expose
    @SerializedName("username")
    private String username;

    public void setFcmid(String fcmid) {
        this.fcmid = fcmid;
    }

    public String getFcmid() {
        return fcmid;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    @Override
    public String toString() {
        return "ZoomMeetingItem{" +
                "fcmid='" + fcmid + '\'' +
                ", deviceType='" + deviceType + '\'' +
                ", username='" + username + '\'' +
                '}';
    }
}