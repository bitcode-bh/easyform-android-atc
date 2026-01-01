package com.easyform.newjitsi.network.response.notifcation;

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
public class ResultsItem {

    @Expose
    @SerializedName("message_id")
    private String messageId;

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getMessageId() {
        return messageId;
    }
}