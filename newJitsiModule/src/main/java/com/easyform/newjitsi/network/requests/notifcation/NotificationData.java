package com.easyform.newjitsi.network.requests.notifcation;

import androidx.annotation.Keep;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.io.Serializable;

/**
 * Created by Savan Solanki on 20/06/2022.
 *
 * @author Savan Solanki
 * @apiNote this request Model class
 */
@Keep
public class NotificationData implements Serializable {

    public NotificationData(String body, String title, String message, String callfrom, String roomName, String videocallType, String role, String senderfcmid, String args, String click_action, String webpush, String device_type, String remotetoken, String role_id, String companyFeatureid, String auth1, String userGetData, String participatId, String uc, String keyType, String jsonData) {
        this.body = body;
        this.title = title;
        this.message = message;
        this.callfrom = callfrom;
        this.roomName = roomName;
        this.videocallType = videocallType;
        this.role = role;
        this.senderfcmid = senderfcmid;
        this.args = args;
        this.click_action = click_action;
        this.webpush = webpush;
        this.device_type = device_type;
        this.remotetoken = remotetoken;
        this.Role_id = role_id;
        this.companyFeatureid = companyFeatureid;
        this.auth1 = auth1;
        this.userGetData = userGetData;
        this.participatId = participatId;
        this.uc = uc;
        this.keyType = keyType;
        this.jsonData = jsonData;

    }


    @Expose
    @SerializedName("body")
    private String body;

    @Expose
    @SerializedName("title")
    private String title;

    @Expose
    @SerializedName("message")
    private String message;

    @Expose
    @SerializedName("callfrom")
    private String callfrom;

    @Expose
    @SerializedName("roomName")
    private String roomName;

    @Expose
    @SerializedName("remotetoken")
    private String remotetoken;

    @Expose
    @SerializedName("videocallType")
    private String videocallType;

    @Expose
    @SerializedName("role")
    private String role;

    @Expose
    @SerializedName("senderfcmid")
    private String senderfcmid;

    @Expose
    @SerializedName("args")
    private String args;

    @Expose
    @SerializedName("click_action")
    private String click_action;
    @Expose
    @SerializedName("webpush")
    private String webpush;

    @Expose
    @SerializedName("device_type")
    private String device_type;

    @Expose
    @SerializedName("Role_id")
    private String Role_id;
    @Expose
    @SerializedName("companyFeatureid")
    private String companyFeatureid;
    @Expose
    @SerializedName("auth1")
    private String auth1;
    @Expose
    @SerializedName("userGetData")
    private String userGetData;

    @Expose
    @SerializedName("participatId")
    private String participatId;

    @Expose
    @SerializedName("uc")
    private String uc;

    @Expose
    @SerializedName("keyType")
    private String keyType;

    @Expose
    @SerializedName("jsonData")
    private String jsonData;


    public String getKeyType() {
        return keyType;
    }

    public void setKeyType(String keyType) {
        this.keyType = keyType;
    }

    public String getJsonData() {
        return jsonData;
    }

    public void setJsonData(String jsonData) {
        this.jsonData = jsonData;
    }

    public String getUc() {
        return uc;
    }

    public void setUc(String uc) {
        this.uc = uc;
    }

    public String getParticipatId() {
        return participatId;
    }

    public void setParticipatId(String participatId) {
        this.participatId = participatId;
    }

    public String getUserGetData() {
        return userGetData;
    }

    public void setUserGetData(String userGetData) {
        this.userGetData = userGetData;
    }

    public String getAuth1() {
        return auth1;
    }

    public void setAuth1(String auth1) {
        this.auth1 = auth1;
    }

    public String getRole_id() {
        return Role_id;
    }

    public void setRole_id(String role_id) {
        Role_id = role_id;
    }

    public String getCompanyFeatureid() {
        return companyFeatureid;
    }

    public void setCompanyFeatureid(String companyFeatureid) {
        this.companyFeatureid = companyFeatureid;
    }

    public String getDevice_type() {
        return device_type;
    }

    public void setDevice_type(String device_type) {
        this.device_type = device_type;
    }

    public String getClick_action() {
        return click_action;
    }

    public void setClick_action(String click_action) {
        this.click_action = click_action;
    }

    public String getWebpush() {
        return webpush;
    }

    public void setWebpush(String webpush) {
        this.webpush = webpush;
    }

    public String getArgs() {
        return args;
    }

    public void setArgs(String args) {
        this.args = args;
    }

    public String getSenderfcmid() {
        return senderfcmid;
    }

    public void setSenderfcmid(String senderfcmid) {
        this.senderfcmid = senderfcmid;
    }

    public void setVideocallType(String videocallType) {
        this.videocallType = videocallType;
    }

    public String getVideocallType() {
        return videocallType;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setCallfrom(String callfrom) {
        this.callfrom = callfrom;
    }

    public String getCallfrom() {
        return callfrom;
    }

    public void setRemotetoken(String remotetoken) {
        this.remotetoken = remotetoken;
    }

    public String getRemotetoken() {
        return remotetoken;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getBody() {
        return body;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getRoomName() {
        return roomName;
    }
}