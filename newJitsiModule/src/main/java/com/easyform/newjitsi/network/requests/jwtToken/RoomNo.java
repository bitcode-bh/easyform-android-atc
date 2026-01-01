package com.easyform.newjitsi.network.requests.jwtToken;

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
    public RoomNo(String roomNo, String emailSend) {
        this.roomNo = roomNo;
        this.emailSend = emailSend;
    }

    @Expose
    @SerializedName("RoomNo")
    private String roomNo;

    @Expose
    @SerializedName("Emailsend")
    private String emailSend;

    public String getEmailSend() {
        return emailSend;
    }

    public void setEmailSend(String emailsend) {
        this.emailSend = emailsend;
    }

    public void setRoomNo(String roomNo) {
        this.roomNo = roomNo;
    }

    public String getRoomNo() {
        return roomNo;
    }
}