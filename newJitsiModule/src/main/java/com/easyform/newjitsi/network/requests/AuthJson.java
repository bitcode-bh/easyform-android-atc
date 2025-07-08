package com.easyform.newjitsi.network.requests;

import androidx.annotation.Keep;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.io.Serializable;

/**
 * Created by NareshChocha on 19/02/2023.
 *
 * @author NareshChocha
 * @apiNote this request Model class
 */
@Keep
public class AuthJson implements Serializable {

    @Expose
    @SerializedName("user_id")
    private String userId;

    @Expose
    @SerializedName("appid")
    private String appid;

    @Expose
    @SerializedName("u_c")
    private String uC;

    @Expose
    @SerializedName("appversion")
    private String appversion;

    @Expose
    @SerializedName("devicetype")
    private String devicetype;

    @Expose
    @SerializedName("username")
    private String username;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getuC() {
        return uC;
    }

    public void setuC(String uC) {
        this.uC = uC;
    }

    public void setAppid(String appid) {
        this.appid = appid;
    }

    public String getAppid() {
        return appid;
    }

    public void setUC(String uC) {
        this.uC = uC;
    }

    public String getUC() {
        return uC;
    }

    public void setAppversion(String appversion) {
        this.appversion = appversion;
    }

    public String getAppversion() {
        return appversion;
    }

    public void setDevicetype(String devicetype) {
        this.devicetype = devicetype;
    }

    public String getDevicetype() {
        return devicetype;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    @Override
    public String toString() {
        return "AuthJson{" +
                "userId=" + userId +
                ", appid='" + appid + '\'' +
                ", uC='" + uC + '\'' +
                ", appversion='" + appversion + '\'' +
                ", devicetype='" + devicetype + '\'' +
                ", username='" + username + '\'' +
                '}';
    }
}