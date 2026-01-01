package com.easyform.newjitsi.network.response.users;

import com.google.gson.annotations.SerializedName;

public class EasyFromUser {

    @SerializedName("DeviceType")
    private String deviceType;

    @SerializedName("user_id")
    private String userId;

    @SerializedName("fcmid")
    private String fcmid;

    @SerializedName("id")
    private String id;

    @SerializedName("login")
    private String login;

    @SerializedName("app_id")
    private String appId;

    @SerializedName("username")
    private String username;

    @SerializedName("EmailId")
    private String EmailId;


    public String getEmailId() {
        return EmailId;
    }

    public void setEmailId(String emailId) {
        EmailId = emailId;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setFcmid(String fcmid) {
        this.fcmid = fcmid;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public String getUserId() {
        return userId;
    }

    public String getFcmid() {
        return fcmid;
    }

    public String getId() {
        return id;
    }

    public String getLogin() {
        return login;
    }

    public String getAppId() {
        return appId;
    }

    public String getUsername() {
        return username;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        EasyFromUser user = (EasyFromUser) obj;
        return username != null ? username.equals(user.username) : user.username == null;
    }

    @Override
    public int hashCode() {
        return username != null ? username.hashCode() : 0;
    }



}