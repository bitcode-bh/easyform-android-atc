package com.easyform.newjitsi.network.requests.usershow;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.io.Serializable;

public class AuthData implements Serializable {

    @SerializedName("username")
    @Expose
    private String username;
    @SerializedName("uc")
    @Expose
    private String uc;
    @SerializedName("userId")
    @Expose
    private String userId;


    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUc() {
        return uc;
    }

    public void setUc(String uc) {
        this.uc = uc;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    @Override
    public String toString() {
        return "AuthData{" +
                "username='" + username + '\'' +
                ", uc='" + uc + '\'' +
                ", userId='" + userId + '\'' +
                '}';
    }
}
