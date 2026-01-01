package com.easyform.newjitsi.network.Models.pluginArgs;

import com.google.gson.annotations.SerializedName;

public class ZoomMeetingItem{

	@SerializedName("fcmid")
	private String fcmid;

	@SerializedName("device_type")
	private String deviceType;

	@SerializedName("task_id")
	private String taskId;

	@SerializedName("username")
	private String username;

	public String getFcmid(){
		return fcmid;
	}

	public String getDeviceType(){
		return deviceType;
	}

	public String getTaskId(){
		return taskId;
	}

	public String getUsername(){
		return username;
	}
}