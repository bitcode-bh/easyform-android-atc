package com.easyform.newjitsi.network.Models;

import com.google.gson.annotations.SerializedName;

public class UserData {

    @SerializedName("COMPANY_FEATURE_ID")
    private String companyFeatureId;

    @SerializedName("deviceType")
    private String deviceType = "android";


    @SerializedName("APP_ID")
    private String appId;

    public String getDeviceType() {
        return deviceType;
    }

    @SerializedName("ROLE_ID")
    private String roleId;

    @SerializedName("USER_ID")
    private String userid;

    @SerializedName("USERNAME")
    private String username;

    @SerializedName("IMEI")
    private String imei;

    @SerializedName("APP_VERSION")
    private String appVersion;

    @SerializedName("UNIQUE_KEY")
    private String uniqueKey;

    @SerializedName("COMPANY_ID")
    private String companyId;

    @SerializedName("FCM_Token")
    private String fCMToken;

    @SerializedName("dateformate")
    private String dateformate;

    public String getDateformate() {
        return dateformate;
    }

    public void setDateformate(String dateformate) {
        this.dateformate = dateformate;
    }

    public String getCompanyFeatureId() {
        return companyFeatureId;
    }

    public String getAppId() {
        return appId;
    }

    public String getRoleId() {
        return roleId;
    }

    public String getUserid() {
        return userid;
    }

    public String getUsername() {
        return username;
    }

    public String getImei() {
        return imei;
    }

    public String getAppVersion() {
        return appVersion;
    }

    public String getUniqueKey() {
        return uniqueKey;
    }

    public String getCompanyId() {
        return companyId;
    }

    public String getFCMToken() {
        return fCMToken;
    }
}