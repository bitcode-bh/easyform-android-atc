package com.easyform.jitsi.network.Models;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class UserGetResponse {


    @Expose
    @SerializedName("data")
    private String data;

    @Expose
    @SerializedName("message")
    private String message;

    @Expose
    @SerializedName("status")
    private int status;

    public void setData(String data) {
        this.data = data;
    }

    public String getData() {
        return data;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public int getStatus() {
        return status;
    }


    @Override
    public String toString() {
        return "UserGetResponse{" +
                "data='" + data + '\'' +
                ", message='" + message + '\'' +
                ", status=" + status +
                '}';
    }
}
