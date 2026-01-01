package com.easyform.newjitsi.network.requests.notifcation;

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
    private FirebaseRequestData data;

    @Expose
    @SerializedName("notification")
    private FirebaseRequestData notification;

    @Expose
    @SerializedName("registration_ids")
    private List<String> registrationIds;

    public FirebaseRequestData getNotification() {
        return notification;
    }

    public void setNotification(FirebaseRequestData notification) {
        this.notification = notification;
    }

    public void setData(FirebaseRequestData data) {
        this.data = data;
    }

    public FirebaseRequestData getData() {
        return data;
    }

    public void setRegistrationIds(List<String> registrationIds) {
        this.registrationIds = registrationIds;
    }

    public List<String> getRegistrationIds() {
        return registrationIds;
    }
}