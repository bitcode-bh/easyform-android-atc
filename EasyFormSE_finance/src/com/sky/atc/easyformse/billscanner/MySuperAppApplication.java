package com.sky.atc.easyformse.billscanner;

import android.app.Application;
import android.content.Context;

public class MySuperAppApplication extends Application {
    private static Application instance;



    private static String textorentity;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

    }

    public static String getTextorentity() {
        return textorentity;
    }

    public static void setTextorentity(String textorentity) {
        MySuperAppApplication.textorentity = textorentity;
    }

    public static Context getContext() {
        return instance.getApplicationContext();
    }


}