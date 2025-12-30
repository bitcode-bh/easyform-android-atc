package com.sky.atc.easyformse.attendance.newattendanceutils.models;

import androidx.annotation.Keep;

import java.util.List;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

@Keep
public class AttendanceData {

	@Expose
	@SerializedName("auto_punchout_duration_hours")
	private String auto_punchout_duration_hours;

	@Expose
	@SerializedName("auto_punchout_duration")
	private String auto_punchout_duration;

	@Expose
	@SerializedName("allow_round_trip")
	private String allow_round_trip;

	@Expose
	@SerializedName("Punchin_Status")
	private String Punchin_Status;
	@Expose
	@SerializedName("Punchout_Status")
	private String Punchout_Status;

	@Expose
	@SerializedName("Chek_out_btn")
	private String ChekOutBtn;

	@Expose
	@SerializedName("Chek_in_btn")
	private String chekInBtn;

	@Expose
	@SerializedName("flow_id")
	private String flowId;

	@Expose
	@SerializedName("Value")
	private List<DaysTimes> daysTimesList;

	@Expose
	@SerializedName("Checksheet_id")
	private String checksheetId;


	@Expose
	@SerializedName("Key")
	private String key;

	@Expose
	@SerializedName("flow_name")
	private String flow_name;

	@Expose
	@SerializedName("face_detection")
	private String face_detection ;

//	@Expose
//	@SerializedName("role_id")
//	private String role_id;

	public String getFlow_name() {
		return flow_name;
	}

	public void setFlow_name(String flow_name) {
		this.flow_name = flow_name;
	}


	public String getFacedetection() {
		return face_detection;
	}

	public void setFacedetection(String face_detection ) {
		face_detection  = face_detection ;
	}

//	public String getRole_id() {
//		return role_id;
//	}
//
//	public void setRole_id(String role_id) {
//		this.role_id = role_id;
//	}

	public String getChekOutBtn() {
		return ChekOutBtn;
	}

	public void setChekOutBtn(String chekOutBtn) {
		ChekOutBtn = chekOutBtn;
	}

	public void setChekInBtn(String chekInBtn){
		this.chekInBtn = chekInBtn;
	}

	public String getChekInBtn(){
		return chekInBtn;
	}

	public void setFlowId(String flowId){
		this.flowId = flowId;
	}

	public String getFlowId(){
		return flowId;
	}

	public void setDaysTimesList(List<DaysTimes> daysTimesList){
		this.daysTimesList = daysTimesList;
	}

	public List<DaysTimes> getDaysTimesList(){
		return daysTimesList;
	}

	public void setChecksheetId(String checksheetId){
		this.checksheetId = checksheetId;
	}

	public String getChecksheetId(){
		return checksheetId;
	}

	public void setKey(String key){
		this.key = key;
	}

	public String getKey(){
		return key;
	}

	public String getPunchin_Status() {
		return Punchin_Status;
	}

	public void setPunchin_Status(String punchin_Status) {
		Punchin_Status = punchin_Status;
	}

	public String getPunchout_Status() {
		return Punchout_Status;
	}

	public void setPunchout_Status(String punchout_Status) {
		Punchout_Status = punchout_Status;
	}

	public String getAuto_punchout_duration() {
		return auto_punchout_duration;
	}

	public void setAuto_punchout_duration(String auto_punchout_duration) {
		this.auto_punchout_duration = auto_punchout_duration;
	}

	public String getAllow_round_trip() {
		return allow_round_trip;
	}

	public void setAllow_round_trip(String allow_round_trip) {
		this.allow_round_trip = allow_round_trip;
	}

	public String getAuto_punchout_duration_hours() {
		return auto_punchout_duration_hours;
	}

	public void setAuto_punchout_duration_hours(String auto_punchout_duration_hours) {
		this.auto_punchout_duration_hours = auto_punchout_duration_hours;
	}

	@Override
 	public String toString(){
		return 
			"AttendanceDataItem{" +
			 "flow_name = '" + flow_name + '\'' +
			",face_detection  = '" + face_detection  + '\'' +
			",auto_punchout_duration_hours = '" + auto_punchout_duration_hours + '\'' +
			",auto_punchout_duration = '" + auto_punchout_duration + '\'' +
			",allow_round_trip = '" + allow_round_trip + '\'' +
			",Punchin_Status = '" + Punchin_Status + '\'' +
			",Punchout_Status = '" + Punchout_Status + '\'' +
			",Chek_out_btn = '" + ChekOutBtn + '\'' +
			",Chek_in_btn = '" + chekInBtn + '\'' +
			",flow_id = '" + flowId + '\'' + 
			",daysTimesList = '" + daysTimesList + '\'' +
			",checksheet_id = '" + checksheetId + '\'' + 
			",key = '" + key + '\'' + 
			"}";
		}
}