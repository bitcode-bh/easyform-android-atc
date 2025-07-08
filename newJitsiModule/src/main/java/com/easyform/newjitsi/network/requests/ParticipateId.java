package com.easyform.newjitsi.network.requests;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;

/**
 * Created by SavanSolanki on 20/06/2022.
 *
 * @author SavanSolanki
 * @apiNote this request Model class
 */

public class ParticipateId implements Serializable {

    @SerializedName("participantId")
    String participantId;


    public ParticipateId(String participantId) {
        this.participantId = participantId;
    }


    public String getParticipantId() {
        return participantId;
    }

    public void setParticipantId(String participantId) {
        this.participantId = participantId;
    }
}
