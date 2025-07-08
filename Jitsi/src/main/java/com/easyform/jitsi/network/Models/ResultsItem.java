package com.easyform.jitsi.network.Models;

import androidx.annotation.Keep;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

/**
 * Created by SavanSolanki on 20/06/2022.
 *
 * @author SavanSolanki
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