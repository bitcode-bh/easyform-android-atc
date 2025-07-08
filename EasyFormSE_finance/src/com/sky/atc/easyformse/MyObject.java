package com.sky.atc.easyformse;

import io.michaelrocks.paranoid.Obfuscate;

/**
 * Created by Acer on 1/17/2017.
 */

//Utils class used in Download
@Obfuscate
public class MyObject {
    int flowid;
    int value;

    public int getFlowid() {
        return flowid;
    }

    public void setFlowid(int flowid) {
        this.flowid = flowid;
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = value;
    }

    public MyObject(int flowid, int value) {
        this.flowid = flowid;
        this.value = value;
    }

}
