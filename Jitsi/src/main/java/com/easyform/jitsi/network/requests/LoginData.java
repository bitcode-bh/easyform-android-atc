package com.easyform.jitsi.network.requests;

import androidx.annotation.Keep;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.io.Serializable;

/**
 * Created by SavanSolanki on 20/06/2022.
 *
 * @author SavanSolanki
 * @apiNote this request Model class
 */
@Keep
public class LoginData implements Serializable {

    @Expose
    @SerializedName("companyId")
    private String companyId;

    @Expose
    @SerializedName("appVersion")
    private String appVersion;

    @Expose
    @SerializedName("appId")
    private String appId;

    @Expose
    @SerializedName("imei")
    private String imei;

    @Expose
    @SerializedName("userId")
    private String userId;

    @Expose
    @SerializedName("username")
    private String username;

    @Expose
    @SerializedName("uc")
    private String uc;

    @Expose
    @SerializedName("servertaskid")
    private String servertaskid;

    public String getServertaskid() {
        return servertaskid;
    }

    public void setServertaskid(String servertaskid) {
        this.servertaskid = servertaskid;
    }

    public String getUc() {
        return uc;
    }

    public void setUc(String uc) {
        this.uc = uc;
    }

    public String getAppVersion() {
        return appVersion;
    }

    public void setAppVersion(String appVersion) {
        this.appVersion = appVersion;
    }

    public void setCompanyId(String companyId) {
        this.companyId = companyId;
    }

    public String getCompanyId() {
        return companyId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getAppId() {
        return appId;
    }

    public void setImei(String imei) {
        this.imei = imei;
    }

    public String getImei() {
        return imei;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    @Override
    public String toString() {
        return "LoginData{" +
                "companyId='" + companyId + '\'' +
                ", appVersion='" + appVersion + '\'' +
                ", appId='" + appId + '\'' +
                ", imei='" + imei + '\'' +
                ", userId='" + userId + '\'' +
                ", username='" + username + '\'' +
                ", uc='" + uc + '\'' +
                ", servertaskid='" + servertaskid + '\'' +
                '}';
    }
}