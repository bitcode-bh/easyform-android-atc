package com.easyform.newjitsi.network.requests.users;

import java.util.List;

import com.easyform.newjitsi.network.Models.ApiAuth;
import com.google.gson.annotations.SerializedName;

public class EasyFromUserRequest {
    public EasyFromUserRequest(int companyId,int offset,int fetch, List<ApiAuth> auth1) {
        this.companyId = companyId;
        this.auth1 = auth1;
        this.offset = offset;
        this.fetch = fetch;
    }

    @SerializedName("offset")
    private int offset;

    @SerializedName("fetch")
    private int fetch;

    @SerializedName("company_id")
    private int companyId;

    @SerializedName("auth1")
    private List<ApiAuth> auth1;


    public int getOffset() {
        return offset;
    }

    public void setOffset(int offset) {
        this.offset = offset;
    }

    public int getFetch() {
        return fetch;
    }

    public void setFetch(int fetch) {
        this.fetch = fetch;
    }

    public void setCompanyId(int companyId) {
        this.companyId = companyId;
    }

    public int getCompanyId() {
        return companyId;
    }

    public void setAuth1(List<ApiAuth> auth1) {
        this.auth1 = auth1;
    }

    public List<ApiAuth> getAuth1() {
        return auth1;
    }

    @Override
    public String toString() {

        return "EasyFromUserRequest{" +
                "company_id='" + companyId + '\'' +
                ", auth1='" + auth1 + '\'' +
                ", offset='" + offset + '\'' +
                ", fetch='" + fetch + '\'' +
                "}";
    }
}