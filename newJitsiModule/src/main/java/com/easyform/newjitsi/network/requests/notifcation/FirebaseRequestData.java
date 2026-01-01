package com.easyform.newjitsi.network.requests.notifcation;

import androidx.annotation.Keep;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

/**
 * Created by NareshChocha on 20/06/2022.
 *
 * @author NareshChocha
 * @apiNote this request Model class
 */
@Keep
public class FirebaseRequestData {

    public FirebaseRequestData(String body, String title,
                               String message, String callfrom,
                               String roomName, String videocallType,
                               String role, String senderfcmid,
                               String click_action, String webpush,
                               String device_type, String remotetoken,
                               String userId,String task_id, String call_type,
                               String keyType, String jsonData, Boolean screenShear,String arjson,String args) {
        this.body = body;
        this.title = title;
        this.message = message;
        this.callfrom = callfrom;
        this.roomName = roomName;
        this.videocallType = videocallType;
        this.role = role;
        this.senderfcmid = senderfcmid;
        this.click_action = click_action;
        this.webpush = webpush;
        this.device_type = device_type;
        this.remotetoken = remotetoken;
        this.userId = userId;
        this.call_type = call_type;
        this.keyType = keyType;
        this.jsonData = jsonData;
        this.screenShear = screenShear;
        this.arjson = arjson;
        this.task_id = task_id;
        this.args = args;

    }

    @Expose
    @SerializedName("args")
    private String args;

    public String getTask_id() {
        return task_id;
    }

    public void setTask_id(String task_id) {
        this.task_id = task_id;
    }

    public String getArgs() {
        return args;
    }

    public void setArgs(String args) {
        this.args = args;
    }
    @Expose
    @SerializedName("keyType")
    private String keyType;

    @Expose
    @SerializedName("screenShear")
    private Boolean screenShear;

    @Expose
    @SerializedName("jsonData")
    private String jsonData;

    @Expose
    @SerializedName("arjson")
    private String arjson;

    public String getArjson() {
        return arjson;
    }

    public void setArjson(String arjson) {
        this.arjson = arjson;
    }

    public Boolean getScreenShear() {
        return screenShear;
    }

    public void setScreenShear(Boolean screenShear) {
        this.screenShear = screenShear;
    }

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

    @Expose
    @SerializedName("body")
    private String body;


    @Expose
    @SerializedName("call_type")
    private String call_type;


    @Expose
    @SerializedName("userId")
    private String userId;
    @Expose
    @SerializedName("task_id")
    private String task_id;

    public String getTaskId() {
        return task_id;
    }

    public void setTaskId(String task_id) {
        this.task_id = task_id;
    }

    public String getCall_type() {
        return call_type;
    }

    public void setCall_type(String call_type) {
        this.call_type = call_type;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

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
    @SerializedName("click_action")
    private String click_action;
    @Expose
    @SerializedName("webpush")
    private String webpush;

    @Expose
    @SerializedName("devicetype")
    private String device_type;


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