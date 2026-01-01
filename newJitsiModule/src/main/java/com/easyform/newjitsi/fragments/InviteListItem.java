package com.easyform.newjitsi.fragments;

import com.easyform.newjitsi.network.response.users.EasyFromUser;

public class InviteListItem {
    public static final int TYPE_HEADER = 0;
    public static final int TYPE_USER = 1;

    private final int type;
    private final String headerTitle;
    private final EasyFromUser user;
    private boolean isAlreadyInvited;

    private String status;

//    public InviteListItem(int type, String headerTitle, EasyFromUser user) {
//        this(type, headerTitle, user, false);
//    }

    public InviteListItem(int type, String headerTitle, EasyFromUser user, boolean isAlreadyInvited, String status) {
        this.type = type;
        this.headerTitle = headerTitle;
        this.user = user;
        this.isAlreadyInvited = isAlreadyInvited;
        this.status = status;
    }

    public int getType() {
        return type;
    }

    public String getHeaderTitle() {
        return headerTitle;
    }

    public EasyFromUser getUser() {
        return user;
    }


    public boolean isAlreadyInvited() {
        return isAlreadyInvited;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setAlreadyInvited(boolean alreadyInvited) {
        isAlreadyInvited = alreadyInvited;
    }
}



