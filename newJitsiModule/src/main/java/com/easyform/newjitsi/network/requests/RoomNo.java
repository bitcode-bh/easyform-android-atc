package com.easyform.newjitsi.network.requests;

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
public class RoomNo {
    public RoomNo(String roomNo, String emailsend) {
        this.roomNo = roomNo;
        this.emailsend = emailsend;
    }

    @Expose
    @SerializedName("RoomNo")
    private String roomNo;

    @Expose
    @SerializedName("Emailsend")
    private String emailsend;

    public String getEmailsend() {
        return emailsend;
    }

    public void setEmailsend(String emailsend) {
        this.emailsend = emailsend;
    }

    public void setRoomNo(String roomNo) {
        this.roomNo = roomNo;
    }

    public String getRoomNo() {
        return roomNo;
    }
}