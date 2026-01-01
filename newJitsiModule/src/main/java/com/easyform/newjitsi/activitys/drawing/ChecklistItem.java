package com.easyform.newjitsi.activitys.drawing;

public class ChecklistItem {
    public String name;
    public String checksheetId;

    public int que_id;

    public ChecklistItem(String name, String checksheetId ,int que_id) {
        this.name = name;
        this.checksheetId = checksheetId;
        this.que_id =que_id;

    }


    @Override
    public String toString() {
        return name;
    }
}