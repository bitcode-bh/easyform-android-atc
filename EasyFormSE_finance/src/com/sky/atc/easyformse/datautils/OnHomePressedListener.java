package com.sky.atc.easyformse.datautils;

import com.github.megatronking.stringfog.annotation.StringFogIgnore;

//Home Button Click Listener
@StringFogIgnore
public interface OnHomePressedListener {
    void onHomePressed();
    void onHomeLongPressed();
    void onHomeGestureCalled();
}
