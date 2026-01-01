package com.easyform.newjitsi.activitys.chat;

/**
 * Created by NareshChocha on 12/6/2023.
 *
 * @author NareshChocha
 */
public class Chatmsglist {

    String username;
    String date;
    String Status_Name;
    String Subject;
    String body;
    String from;
    String createdate;
    String email_json;
    String activity_type;
    String Prev_Status_Name;
    String status_millisecond;
    String To;
    String BCC;
    String CC;

    public String getTo() {
        return To;
    }

    public void setTo(String to) {
        To = to;
    }

    public String getBCC() {
        return BCC;
    }

    public void setBCC(String BCC) {
        this.BCC = BCC;
    }

    public String getCC() {
        return CC;
    }

    public void setCC(String CC) {
        this.CC = CC;
    }

    public String getStatus_millisecond() {
        return status_millisecond;
    }

    public void setStatus_millisecond(String status_millisecond) {
        this.status_millisecond = status_millisecond;
    }

    public String getPrev_Status_Name() {
        return Prev_Status_Name;
    }

    public void setPrev_Status_Name(String prev_Status_Name) {
        Prev_Status_Name = prev_Status_Name;
    }

    public String getActivity_type() {
        return activity_type;
    }

    public void setActivity_type(String activity_type) {
        this.activity_type = activity_type;
    }

    public String getSubject() {
        return Subject;
    }

    public void setSubject(String subject) {
        Subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getCreatedate() {
        return createdate;
    }

    public void setCreatedate(String createdate) {
        this.createdate = createdate;
    }

    public String getEmail_json() {
        return email_json;
    }

    public void setEmail_json(String email_json) {
        this.email_json = email_json;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStatus_Name() {
        return Status_Name;
    }

    public void setStatus_Name(String status_Name) {
        Status_Name = status_Name;
    }
}
