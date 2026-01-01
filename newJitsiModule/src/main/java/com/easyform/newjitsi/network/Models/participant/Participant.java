package com.easyform.newjitsi.network.Models.participant;

import com.google.gson.annotations.SerializedName;

public class Participant{

	@SerializedName("participantId")
	private String participantId;

	@SerializedName("role")
	private String role;

	@SerializedName("name")
	private String name;

	@SerializedName("email")
	private String email;

	@SerializedName("isLocal")
	private String isLocal;

	@SerializedName("devicetype")
	private String devicetype;

	public String getParticipantId(){
		return participantId;
	}

	public String getRole(){
		return role;
	}

	public String getName(){
		return name;
	}

	public String getEmail(){
		return email;
	}

	public String getIsLocal(){
		return isLocal;
	}

	public String getDevicetype() {
		return devicetype;
	}
}