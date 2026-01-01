package com.easyform.newjitsi.network.response.notifcation;

import androidx.annotation.Keep;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Created by NareshChocha on 20/06/2022.
 *
 * @author NareshChocha
 * @apiNote this request Model class
 */
@Keep
public class FirebaseResponse {

    @Expose
    @SerializedName("canonical_ids")
    private int canonicalIds;

    @Expose
    @SerializedName("success")
    private int success;

    @Expose
    @SerializedName("failure")
    private int failure;

    @Expose
    @SerializedName("results")
    private List<ResultsItem> results;

    @Expose
    @SerializedName("multicast_id")
    private long multicastId;

    public void setCanonicalIds(int canonicalIds) {
        this.canonicalIds = canonicalIds;
    }

    public int getCanonicalIds() {
        return canonicalIds;
    }

    public void setSuccess(int success) {
        this.success = success;
    }

    public int getSuccess() {
        return success;
    }

    public void setFailure(int failure) {
        this.failure = failure;
    }

    public int getFailure() {
        return failure;
    }

    public void setResults(List<ResultsItem> results) {
        this.results = results;
    }

    public List<ResultsItem> getResults() {
        return results;
    }

    public void setMulticastId(long multicastId) {
        this.multicastId = multicastId;
    }

    public long getMulticastId() {
        return multicastId;
    }
}