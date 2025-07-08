package com.example.easyformzoom.zoom.datautils;

public class ListUsernameFId {

    private String username;
    private String userid;
    private String deviceType;

    public String getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public ListUsernameFId(String username, String userid, String deviceType) {
        this.username = username;
        this.userid = userid;
        this.deviceType = deviceType;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUserid() {
        return userid;
    }

    public void setUserid(String userid) {
        this.userid = userid;
    }
}
