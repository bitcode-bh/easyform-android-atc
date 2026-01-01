package com.easyform.newjitsi.network.response.users;

import com.easyform.newjitsi.R;
import com.easyform.newjitsi.network.Models.participant.Participant;
import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;

public class EasyFromUserItem {

    @SerializedName("Emailid")
    private String emailid;

    @SerializedName("data")
    private String data;

    @SerializedName("message")
    private String message;

    @SerializedName("status")
    private int status;

    public String getEmailid() {
        return emailid;
    }

    public List<EasyFromUser> getData() {
        Gson mGson = new Gson();
        Type listType = new TypeToken<List<EasyFromUser>>() {
        }.getType();
        return mGson.fromJson(data.replace("\\", ""), listType);
    }

    public String getMessage() {
        return message;
    }

    public void setEmailid(String emailid) {
        this.emailid = emailid;
    }

    public void setData(String data) {
        this.data = data;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}