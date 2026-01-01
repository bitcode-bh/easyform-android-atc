package com.easyform.newjitsi.network.Models;

import com.google.gson.annotations.SerializedName;

public class ApiAuth{

	@SerializedName("user_id")
	private String userId;

	@SerializedName("u_c")
	private String uC;

	@SerializedName("username")
	private String username;

	public String getUserId(){
		return userId;
	}

	public String getUC(){
		return uC;
	}

	public String getUsername(){
		return username;
	}
}