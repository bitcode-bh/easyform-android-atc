package com.easyform.jitsi.network.Models;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.io.Serializable;

public class Auth1 implements Serializable {

    public Auth1(String username, String uC, String userId) {
        this.username = username;
        this.uC = uC;
        this.userId = userId;
    }

    @SerializedName("username")
    @Expose
    private String username;
    @SerializedName("u_c")
    @Expose
    private String uC;
    @SerializedName("user_id")
    @Expose
    private String userId;
    private final static long serialVersionUID = -8891397892425362266L;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getuC() {
        return uC;
    }

    public void setuC(String uC) {
        this.uC = uC;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }


    @Override
    public String toString() {
        return "Auth1{" +
                "username='" + username + '\'' +
                ", uC='" + uC + '\'' +
                ", userId=" + userId +
                '}';
    }
}
