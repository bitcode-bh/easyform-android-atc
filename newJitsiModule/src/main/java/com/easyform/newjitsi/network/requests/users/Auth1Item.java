package com.easyform.newjitsi.network.requests.users;

import com.google.gson.annotations.SerializedName;

public class Auth1Item{

	@SerializedName("user_id")
	private String userId;

	@SerializedName("u_c")
	private String uC;

	@SerializedName("username")
	private String username;

	public void setUserId(String userId){
		this.userId = userId;
	}

	public String getUserId(){
		return userId;
	}

	public void setUC(String uC){
		this.uC = uC;
	}

	public String getUC(){
		return uC;
	}

	public void setUsername(String username){
		this.username = username;
	}

	public String getUsername(){
		return username;
	}

	@Override
 	public String toString(){
		return 
			"Auth1Item{" + 
			"user_id = '" + userId + '\'' + 
			",u_c = '" + uC + '\'' + 
			",username = '" + username + '\'' + 
			"}";
		}
}