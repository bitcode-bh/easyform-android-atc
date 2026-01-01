package com.easyform.newjitsi;

import android.app.Application;
import android.content.Context;

public class App extends Application {

    public static Context context;

    public static void setContext(Context context) {
        App.context = context;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        context = this;
    }

    public static Context getContext() {
        return context;
    }
}