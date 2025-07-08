package com.easyform.jitsi.network.Models;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

import java.io.Serializable;


/**
 * Created by SavanSolanki on 20/06/2022.
 *
 * @author SavanSolanki
 * @apiNote this request Model class
 */

public class Participate implements Serializable {

    @Expose
    @SerializedName("name")
    String name;
    @Expose
    @SerializedName("participantId")
    String participantId;
    @Expose
    @SerializedName("role")
    String role;


    public Participate(String name, String participantId, String role) {
        this.name = name;
        this.participantId = participantId;
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getParticipantId() {
        return participantId;
    }

    public void setParticipantId(String participantId) {
        this.participantId = participantId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }


    @Override
    public String toString() {
        return "Participate{" +
                "name='" + name + '\'' +
                ", participantId='" + participantId + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
