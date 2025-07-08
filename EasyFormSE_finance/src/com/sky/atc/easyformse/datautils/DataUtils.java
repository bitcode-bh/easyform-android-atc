package com.sky.atc.easyformse.datautils;

import io.michaelrocks.paranoid.Obfuscate;

//Data Utils for set and get Server milli from login_plug
@Obfuscate
public class DataUtils {

    public static long getServiceMilli() {
        return serviceMilli;
    }

    public static void setServiceMilli(long serviceMilli) {
        DataUtils.serviceMilli = serviceMilli;
    }
    static long serviceMilli;


}
