package com.sky.atc.easyformse.datautils;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Data Utils for set and get Server milli from login_plug
@StringFogIgnore
public class DataUtils {

    public static long getServiceMilli() {
        return serviceMilli;
    }

    public static void setServiceMilli(long serviceMilli) {
        DataUtils.serviceMilli = serviceMilli;
    }
    static long serviceMilli;


}
