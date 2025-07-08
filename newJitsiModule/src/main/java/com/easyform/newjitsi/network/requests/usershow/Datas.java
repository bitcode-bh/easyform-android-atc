package com.easyform.newjitsi.network.requests.usershow;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class Datas {
    @SerializedName("user_id")
    @Expose
    private String userId;
    @SerializedName("username")
    @Expose
    private String username;
    @SerializedName("login")
    @Expose
    private String login;
    @SerializedName("id")
    @Expose
    private String id;
    @SerializedName("fcmid")
    @Expose
    private String fcmid;
    @SerializedName("DeviceType")
    @Expose
    private String deviceType;

    @SerializedName("app_id")
    @Expose
    private String appId;

    @Expose
    @SerializedName("task_id")
    private String task_id;

    public String getTask_id() {
        return task_id;
    }

    public void setTask_id(String task_id) {
        this.task_id = task_id;
    }

    private final static long serialVersionUID = -2648542355779687338L;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFcmid() {
        return fcmid;
    }

    public void setFcmid(String fcmid) {
        this.fcmid = fcmid;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    @Override
    public String toString() {
        return "Datas{" +
                "userId='" + userId + '\'' +
                ", username='" + username + '\'' +
                ", login='" + login + '\'' +
                ", id='" + id + '\'' +
                ", fcmid='" + fcmid + '\'' +
                ", deviceType='" + deviceType + '\'' +
                ", appId='" + appId + '\'' +
                '}';
    }
}
