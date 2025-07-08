package com.nareshchocha.databasemanager.models;

/**
 * Created by NareshChocha on 3/29/2022.
 *
 * @author NareshChocha
 */
public class MessageData {
    boolean isError;
    String message;

    public MessageData(boolean isError, String message) {
        this.isError = isError;
        this.message = message;
    }

    public boolean isError() {
        return isError;
    }

    public String getMessage() {
        return message;
    }
}
