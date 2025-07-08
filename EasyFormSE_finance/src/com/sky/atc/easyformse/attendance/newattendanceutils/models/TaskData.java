package com.sky.atc.easyformse.attendance.newattendanceutils.models;

import androidx.annotation.Keep;

import java.io.Serializable;

/**
 * Created by NareshChocha on 4/6/2022.
 *
 * @author NareshChocha
 */
@Keep
public class TaskData implements Serializable {

    private String username;
    private String userId;
    private int moduleId;
    String checkSheetId;
    String moduleName;
    String CheckOutBtn;
    String CheckInBtn;
    String Punchin_Status;
    String Punchout_Status;
    String auto_punchout_duration;
    String allow_round_trip;

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


    public String getCheckInBtn() {
        return CheckInBtn;
    }

    public void setCheckInBtn(String checkInBtn) {
        CheckInBtn = checkInBtn;
    }

    public String getCheckOutBtn() {
        return CheckOutBtn;
    }

    public void setCheckOutBtn(String checkOutBtn) {
        CheckOutBtn = checkOutBtn;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public int getModuleId() {
        return moduleId;
    }

    public void setModuleId(int moduleId) {
        this.moduleId = moduleId;
    }

    public String getCheckSheetId() {
        return checkSheetId;
    }

    public void setCheckSheetId(String checkSheetId) {
        this.checkSheetId = checkSheetId;
    }

    public String getModuleName() {
        return moduleName;
    }

    public void setModuleName(String moduleName) {
        this.moduleName = moduleName;
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

    @Override
    public String toString() {
        return "TaskData{" +
                "username='" + username + '\'' +
                ", userId='" + userId + '\'' +
                ", moduleId=" + moduleId +
                ", checkSheetId='" + checkSheetId + '\'' +
                ", moduleName='" + moduleName + '\'' +
                ", CheckOutBtn='" + CheckOutBtn + '\'' +
                ", Chek_in_btn='" + CheckInBtn + '\'' +
                ", Punchin_Status='" + Punchin_Status + '\'' +
                ", Punchout_Status='" + Punchout_Status + '\'' +
                ", auto_punchout_duration='" + auto_punchout_duration + '\'' +
                ", allow_round_trip='" + allow_round_trip + '\'' +
                '}';
    }
}
