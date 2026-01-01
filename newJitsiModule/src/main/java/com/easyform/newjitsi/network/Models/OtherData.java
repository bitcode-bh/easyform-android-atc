package com.easyform.newjitsi.network.Models;

import com.google.gson.JsonObject;
import com.google.gson.annotations.SerializedName;

public class OtherData {

    @SerializedName("WEB_PUSH")
    private JsonObject webPush;

    @SerializedName("WCFURL")
    private String wcfUrl;

    @SerializedName("CLICK_ACTION")
    private String clickAction;

    @SerializedName("USERDATA_FROM_COMPANY_ID_URL")
    private String userDataFromCompanyIdUrl;

    @SerializedName("Common_Wcf_Url")
    private String Common_Wcf_Url;

    public String getCommon_Wcf_Url() {
        return Common_Wcf_Url;
    }

    @SerializedName("server_task_id")
    private String server_task_id;

    @SerializedName("flow_id")
    private String flow_id;

    @SerializedName("role_id")
    private String role_id;

    @SerializedName("site_id")
    private String site_id;

    @SerializedName("EmailId")
    private String EmailId;


    @SerializedName("start_status")
    private String start_status;

    @SerializedName("user_id")
    private String user_id;

    @SerializedName("udf_id")
    private String udf_id;


    public String getUdf_id() {
        return udf_id;
    }

    public void setUdf_id(String udf_id) {
        this.udf_id = udf_id;
    }

    public String getUser_id() {
        return user_id;
    }

    public String getStart_status() {
        return start_status;
    }

    public String getEmailId() {
        return EmailId;
    }

    public String getFlow_id() {
        return flow_id;
    }

    public String getRole_id() {
        return role_id;
    }

    public String getSite_id() {
        return site_id;
    }

    public String getServer_task_id() {
        return server_task_id;
    }

    public JsonObject getWebPush() {
        return webPush;
    }

    public String getWcfUrl() {
        return wcfUrl;
    }

    public String getUserDataFromCompanyIdUrl() {
        return userDataFromCompanyIdUrl;
    }

    public String getClickAction() {
        return clickAction;
    }

}