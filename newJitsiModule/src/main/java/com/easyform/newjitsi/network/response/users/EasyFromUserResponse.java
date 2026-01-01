package com.easyform.newjitsi.network.response.users;

import java.util.List;

import com.google.gson.annotations.SerializedName;

public class EasyFromUserResponse {

    @SerializedName("EasyFromUser")
    private List<EasyFromUserItem> easyFromUser;

    public void setEasyFromUser(List<EasyFromUserItem> easyFromUser) {
        this.easyFromUser = easyFromUser;
    }

    public List<EasyFromUserItem> getEasyFromUser() {
        return easyFromUser;
    }
}