package com.easyform.jitsi.network.Models;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.io.Serializable;
import java.util.List;

public class FcmRequest {

    public FcmRequest(String companyId, String taskId, List<Auth1> auth1) {
        this.companyId = companyId;
        this.taskId = taskId;
        this.auth1 = auth1;
    }

    @SerializedName("company_id")
    @Expose
    private String companyId;
    @SerializedName("task_id")
    @Expose
    private String taskId;
    @SerializedName("auth1")
    @Expose
    private List<Auth1> auth1 = null;
    private final static long serialVersionUID = 1655458063501257340L;

    public String getCompanyId() {
        return companyId;
    }

    public void setCompanyId(String companyId) {
        this.companyId = companyId;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public List<Auth1> getAuth1() {
        return auth1;
    }

    public void setAuth1(List<Auth1> auth1) {
        this.auth1 = auth1;
    }


}
