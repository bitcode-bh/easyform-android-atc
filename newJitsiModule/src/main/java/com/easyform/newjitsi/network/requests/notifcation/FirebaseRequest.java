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
    private NotificationData notificationData;

    @Expose
    @SerializedName("notification")
    private NotificationData notification;

    @Expose
    @SerializedName("registration_ids")
    private List<String> registrationIds;

    public NotificationData getNotification() {
        return notification;
    }

    public void setNotification(NotificationData notification) {
        this.notification = notification;
    }

    public void setData(NotificationData notificationData) {
        this.notificationData = notificationData;
    }

    public NotificationData getData() {
        return notificationData;
    }

    public void setRegistrationIds(List<String> registrationIds) {
        this.registrationIds = registrationIds;
    }

    public List<String> getRegistrationIds() {
        return registrationIds;
    }
}