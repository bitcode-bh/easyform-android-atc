package com.sky.atc.easyformse.datautils;

import io.michaelrocks.paranoid.Obfuscate;

//Home Button Click Listener
@Obfuscate
public interface OnHomePressedListener {
    void onHomePressed();
    void onHomeLongPressed();
    void onHomeGestureCalled();
}
