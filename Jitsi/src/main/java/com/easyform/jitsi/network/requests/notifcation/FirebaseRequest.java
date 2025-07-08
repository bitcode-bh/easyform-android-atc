package com.easyform.jitsi.network.requests.notifcation;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Created by NareshChocha on 8/04/2021.
 *
 * @author NareshChocha
 * @apiNote this request Model class
 */
public class FirebaseRequest {

    @Expose
    @SerializedName("data")
    private Data data;

    @Expose
    @SerializedName("notification")
    private Data notification;

    @Expose
    @SerializedName("registration_ids")
    private List<String> registrationIds;

    public Data getNotification() {
        return notification;
    }

    public void setNotification(Data notification) {
        this.notification = notification;
    }

    public void setData(Data data) {
        this.data = data;
    }

    public Data getData() {
        return data;
    }

    public void setRegistrationIds(List<String> registrationIds) {
        this.registrationIds = registrationIds;
    }

    public List<String> getRegistrationIds() {
        return registrationIds;
    }
}